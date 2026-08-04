'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import type { GroupUpdatedEvent } from '../types/group-action.type';
import { CONVERSATIONS_QUERY_KEY } from './use-conversations';
import { GROUP_MEMBERS_QUERY_KEY } from './use-group-members';
import type { ConversationHistoryClearedEvent } from '../types/conversation-action.type';
import {
  applyConversationReadState,
  clearConversationHistoryCaches,
  removeConversationCaches,
  sortConversations,
} from '../utils/conversation-cache';
import {
  clearConversationReopenedMarker,
  wasConversationReopenedAfter,
} from '../utils/conversation-reopen-state';
import { useConversationDetailsStore } from '../stores/conversation-details.store';
import { useMessageComposerStore } from '../stores/message-composer.store';
import { clearConversationUiState } from '../utils/conversation-ui-state';
import type { Conversation, Message, MessageType } from '../types';
import { MESSAGES_QUERY_KEY } from './use-messages';
import type { ConversationReadStateEvent } from '../types/conversation-unread.type';
import {
  clearDeletedMessageSelections,
  MESSAGE_REACTION_DETAILS_QUERY_KEY,
  refreshDeletedMessageQueries,
  refreshRevokedMessageQueries,
  syncDeletedMessageCaches,
  syncReactionUpdatedCaches,
  syncRevokedMessageCaches,
} from './use-message-actions';
import type {
  MessageDeletedForMeEvent,
  MessageReactionUpdatedEvent,
  MessageRevokedEvent,
} from '../types/message-action.type';
import { conversationKeys } from '../constants/conversation-query-keys';
import {
  upsertReceivedMessage,
  type MessageInfiniteData,
} from '../utils/message-idempotency';

const MAX_RECENT_MESSAGE_EVENTS = 500;

const rememberMessageEvent = (events: Map<string, string>, key: string, fingerprint: string) => {
  if (events.get(key) === fingerprint) return false;
  events.set(key, fingerprint);
  if (events.size > MAX_RECENT_MESSAGE_EVENTS) {
    const oldestKey = events.keys().next().value;
    if (oldestKey !== undefined) events.delete(oldestKey);
  }
  return true;
};

export const useConversationSocketSync = (socket: Socket | null) => {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);
  const recentMessageEventsRef = useRef(new Map<string, string>());

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    recentMessageEventsRef.current.clear();
    if (!socket) return;
    const recentMessageEvents = recentMessageEventsRef.current;

    const handleGroupUpdated = (event: GroupUpdatedEvent) => {
      if (!event?.conversation_id) return;

      const currentUserId = useAuthStore.getState().user?._id;
      const affectedUserIds = Array.isArray(event.affected_user_ids)
        ? event.affected_user_ids
        : [];
      const currentUserLeft = currentUserId
        ? (event.change_type === 'member_left' && event.actor_id === currentUserId) ||
          (event.change_type === 'member_removed' &&
            affectedUserIds.includes(currentUserId)) ||
          (event.change_type === 'admin_transferred' && event.actor_id === currentUserId)
        : false;

      if (currentUserLeft) {
        clearConversationUiState(event.conversation_id);
        if (pathnameRef.current === `/messages/${event.conversation_id}`) {
          router.replace('/messages');
        }
        void removeConversationCaches(queryClient, event.conversation_id).then(() =>
          Promise.all([
            queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY }),
            queryClient.invalidateQueries({ queryKey: conversationKeys.unreadSummary() }),
          ]),
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
      if (
        !rememberMessageEvent(
          recentMessageEvents,
          `receive:${newMessage._id}`,
          `${newMessage.send_at}:${newMessage.status}`,
        )
      ) {
        return;
      }

      queryClient.setQueryData<MessageInfiniteData>(
        MESSAGES_QUERY_KEY(newMessage.conversation_id),
        (currentData) => upsertReceivedMessage(currentData, newMessage),
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

        return sortConversations(
          conversations.map((conversation) =>
            conversation._id === newMessage.conversation_id
              ? {
                  ...conversation,
                  last_message_at: newMessage.send_at,
                  last_message_preview: {
                    message_id: newMessage._id,
                    sender_id: newMessage.sender_id,
                    sender_info: newMessage.sender_info,
                    kind: newMessage.kind ?? 'user',
                    system_event_type: newMessage.system_event_type ?? null,
                    content: newMessage.content,
                    message_type: messageType,
                  },
                }
              : conversation,
          ),
        );
      });

      void queryClient.invalidateQueries({
        queryKey: CONVERSATIONS_QUERY_KEY,
        exact: true,
        refetchType: 'active',
      });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.unreadSummary(),
        exact: true,
        refetchType: 'active',
      });
    };

    const handleReadState = (event: ConversationReadStateEvent) => {
      if (!event?.conversation_id || !Number.isSafeInteger(event.version) || event.version < 0) {
        return;
      }
      const didCompareVersion = applyConversationReadState(queryClient, event);
      if (didCompareVersion) return;
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.unreadSummary(),
        refetchType: 'active',
      });
      void queryClient.invalidateQueries({
        queryKey: CONVERSATIONS_QUERY_KEY,
        refetchType: 'active',
      });
    };

    const handleMessageRevoked = (event: MessageRevokedEvent) => {
      if (!event?.conversation_id || !event.message_id) return;
      if (!rememberMessageEvent(recentMessageEvents, `revoked:${event.message_id}`, 'revoked')) {
        return;
      }
      syncRevokedMessageCaches(queryClient, event);
      useMessageComposerStore.getState().clearReplyToMessage(event.message_id);
      void refreshRevokedMessageQueries(queryClient, event.conversation_id);
    };

    const handleMessageDeletedForMe = (event: MessageDeletedForMeEvent) => {
      if (!event?.conversation_id || !event.message_id) return;
      if (!rememberMessageEvent(recentMessageEvents, `deleted:${event.message_id}`, 'deleted')) {
        return;
      }
      syncDeletedMessageCaches(queryClient, event);
      clearDeletedMessageSelections(event);
      void refreshDeletedMessageQueries(queryClient, event);
    };

    const handleMessageReactionUpdated = (event: MessageReactionUpdatedEvent) => {
      if (!event?.conversation_id || !event.message_id) return;
      const fingerprint = event.reactions
        .map((reaction) => `${reaction.user_id}:${reaction.emoji}`)
        .sort()
        .join('|');
      if (
        !rememberMessageEvent(
          recentMessageEvents,
          `reaction:${event.message_id}`,
          fingerprint,
        )
      ) {
        return;
      }
      syncReactionUpdatedCaches(queryClient, event);
      void queryClient.invalidateQueries({
        queryKey: MESSAGE_REACTION_DETAILS_QUERY_KEY(event.message_id),
        refetchType: 'active',
      });
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
      if (pathnameRef.current === `/messages/${event.conversation_id}`) {
        router.replace('/messages');
      }
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.unreadSummary(),
      });
    };

    socket.on('@conversation:group-updated', handleGroupUpdated);
    socket.on('@conversation:receive', handleReceiveMessage);
    socket.on('@conversation:read-state', handleReadState);
    socket.on('@conversation:history-cleared', handleHistoryCleared);
    socket.on('@message:revoked', handleMessageRevoked);
    socket.on('@message:deleted-for-me', handleMessageDeletedForMe);
    socket.on('@message:reaction-updated', handleMessageReactionUpdated);

    return () => {
      socket.off('@conversation:group-updated', handleGroupUpdated);
      socket.off('@conversation:receive', handleReceiveMessage);
      socket.off('@conversation:read-state', handleReadState);
      socket.off('@conversation:history-cleared', handleHistoryCleared);
      socket.off('@message:revoked', handleMessageRevoked);
      socket.off('@message:deleted-for-me', handleMessageDeletedForMe);
      socket.off('@message:reaction-updated', handleMessageReactionUpdated);
    };
  }, [queryClient, router, socket]);
};
