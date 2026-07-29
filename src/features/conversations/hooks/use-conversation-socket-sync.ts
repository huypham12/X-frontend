'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import type { GroupUpdatedEvent } from '../types/group-action.type';
import { CONVERSATIONS_QUERY_KEY } from './use-conversations';
import { GROUP_MEMBERS_QUERY_KEY } from './use-group-members';
import type { ConversationHistoryClearedEvent } from '../types/conversation-action.type';
import {
  clearConversationHistoryCaches,
  removeConversationCaches,
} from '../utils/conversation-cache';
import {
  clearConversationReopenedMarker,
  wasConversationReopenedAfter,
} from '../utils/conversation-reopen-state';
import { useConversationDetailsStore } from '../stores/conversation-details.store';
import { useMessageComposerStore } from '../stores/message-composer.store';
import type { Conversation, Message, MessageType, PaginationResponse } from '../types';
import { MESSAGES_QUERY_KEY } from './use-messages';

export const useConversationSocketSync = (socket: Socket | null) => {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    const handleGroupUpdated = (event: GroupUpdatedEvent) => {
      if (!event?.conversation_id) return;

      const currentUserId = useAuthStore.getState().user?._id;
      const currentUserLeft = currentUserId
        ? (event.change_type === 'member_left' && event.actor_id === currentUserId) ||
          (event.change_type === 'member_removed' &&
            event.affected_user_ids.includes(currentUserId)) ||
          (event.change_type === 'admin_transferred' && event.actor_id === currentUserId)
        : false;

      if (currentUserLeft) {
        const details = useConversationDetailsStore.getState();
        if (details.openConversationId === event.conversation_id) details.closeDetails();
        const composer = useMessageComposerStore.getState();
        if (composer.conversationId === event.conversation_id) composer.clearReply();
        if (pathname === `/messages/${event.conversation_id}`) router.replace('/messages');
        void removeConversationCaches(queryClient, event.conversation_id).then(() =>
          queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY }),
        );
        return;
      }

      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: GROUP_MEMBERS_QUERY_KEY(event.conversation_id),
      });
    };

    const handleReceiveMessage = (newMessage: Message) => {
      if (!newMessage?.conversation_id) return;

      queryClient.setQueryData<InfiniteData<PaginationResponse<Message>, string | undefined>>(
        MESSAGES_QUERY_KEY(newMessage.conversation_id),
        (currentData) => {
          if (!currentData) return currentData;
          const alreadyExists = currentData.pages.some((page) =>
            page.messages.some((message) => message._id === newMessage._id),
          );
          if (alreadyExists) return currentData;

          return {
            ...currentData,
            pages: currentData.pages.map((page, index) =>
              index === 0
                ? { ...page, messages: [newMessage, ...page.messages] }
                : page,
            ),
          };
        },
      );

      const cachedConversations = queryClient.getQueryData<Conversation[]>(
        CONVERSATIONS_QUERY_KEY,
      );
      const hasConversation = cachedConversations?.some(
        (conversation) => conversation._id === newMessage.conversation_id,
      );
      const messageType: MessageType = newMessage.medias_info?.[0]?.type || 'text';

      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (conversations) => {
        if (!conversations || !hasConversation) return conversations;

        return conversations
          .map((conversation) =>
            conversation._id === newMessage.conversation_id
              ? {
                  ...conversation,
                  last_message_at: newMessage.send_at,
                  last_message_preview: {
                    message_id: newMessage._id,
                    sender_id: newMessage.sender_id,
                    content: newMessage.content,
                    message_type: messageType,
                  },
                }
              : conversation,
          )
          .sort((first, second) => {
            if (first.is_pinned !== second.is_pinned) return first.is_pinned ? -1 : 1;
            return (
              new Date(second.last_message_at || 0).getTime() -
              new Date(first.last_message_at || 0).getTime()
            );
          });
      });

      if (!hasConversation) {
        void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      }
    };

    const handleHistoryCleared = (event: ConversationHistoryClearedEvent) => {
      if (!event?.conversation_id) return;
      if (wasConversationReopenedAfter(event.conversation_id, event.cleared_at)) return;

      const cachedConversation = queryClient
        .getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY)
        ?.find((conversation) => conversation._id === event.conversation_id);
      const conversationUpdatedAt = cachedConversation
        ? new Date(cachedConversation.updated_at).getTime()
        : Number.NaN;
      const historyClearedAt = new Date(event.cleared_at).getTime();
      if (
        Number.isFinite(conversationUpdatedAt) &&
        Number.isFinite(historyClearedAt) &&
        conversationUpdatedAt > historyClearedAt
      ) {
        return;
      }

      clearConversationReopenedMarker(event.conversation_id);
      clearConversationHistoryCaches(queryClient, event.conversation_id);
      const details = useConversationDetailsStore.getState();
      if (details.openConversationId === event.conversation_id) details.closeDetails();
      const composer = useMessageComposerStore.getState();
      if (composer.conversationId === event.conversation_id) composer.clearReply();
      if (pathname === `/messages/${event.conversation_id}`) router.replace('/messages');
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    };

    socket.on('@conversation:group-updated', handleGroupUpdated);
    socket.on('@conversation:receive', handleReceiveMessage);
    socket.on('@conversation:history-cleared', handleHistoryCleared);

    return () => {
      socket.off('@conversation:group-updated', handleGroupUpdated);
      socket.off('@conversation:receive', handleReceiveMessage);
      socket.off('@conversation:history-cleared', handleHistoryCleared);
    };
  }, [pathname, queryClient, router, socket]);
};
