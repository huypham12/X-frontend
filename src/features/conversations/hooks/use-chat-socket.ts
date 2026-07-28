import { useEffect } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useSocket } from '@/providers/socket-provider';
import { toast } from 'sonner';
import type { Conversation, Message, MessageType, PaginationResponse } from '../types';
import { CONVERSATIONS_QUERY_KEY } from './use-conversations';
import { MESSAGES_QUERY_KEY } from './use-messages';
import { conversationPartnerProfileQueryKey } from './use-conversation-partner-profile';
import type {
  MessageDeletedForMeEvent,
  MessageRevokedEvent,
} from '../types/message-action.type';
import {
  clearDeletedMessageSelections,
  refreshDeletedMessageQueries,
  refreshRevokedMessageQueries,
  syncDeletedMessageCaches,
  syncRevokedMessageCaches,
} from './use-message-actions';
import { useMessageComposerStore } from '../stores/message-composer.store';

interface ConversationSocketError {
  code?: string;
  conversation_id?: string;
  message?: string;
}

interface ConversationSendAcknowledgement {
  success: boolean;
  message_id?: string;
  error?: ConversationSocketError;
}

interface SendMessagePayload {
  conversation_id: string;
  conversation_type: 'direct' | 'group';
  content: string;
  media_ids?: string[];
  reply_to_message_id?: string;
}

const DIRECT_MESSAGE_BLOCKED_CODE = 'DIRECT_MESSAGE_BLOCKED';

export const useChatSocket = (conversationId?: string, partnerUsername?: string) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleReceiveMessage = (newMessage: Message) => {
      const messageType: MessageType = newMessage.medias_info?.[0]?.type || 'text';

      // 1. Update Messages list if we are currently viewing this conversation
      if (conversationId && newMessage.conversation_id === conversationId) {
        queryClient.setQueryData<InfiniteData<PaginationResponse<Message>, string | undefined>>(
          MESSAGES_QUERY_KEY(conversationId),
          (oldData) => {
            if (!oldData) return oldData;
          
            // The API returns newest messages first, so prepend to the first page.
            const newPages = oldData.pages.map((page, index) =>
              index === 0
                ? { ...page, messages: [newMessage, ...page.messages] }
                : page
            );

            return { ...oldData, pages: newPages };
          }
        );
      }

      // 2. Update Conversations list (last message preview & timestamp)
      queryClient.setQueryData(CONVERSATIONS_QUERY_KEY, (oldConversations: Conversation[] | undefined) => {
        if (!oldConversations) return oldConversations;

        const updated = oldConversations.map(conv => {
          if (conv._id === newMessage.conversation_id) {
            return {
              ...conv,
              last_message_at: newMessage.send_at,
              last_message_preview: {
                message_id: newMessage._id,
                sender_id: newMessage.sender_id,
                content: newMessage.content,
                message_type: messageType
              }
            };
          }
          return conv;
        });

        // Re-sort so that the updated conversation jumps to the top (below pinned)
        return updated.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          
          const timeA = new Date(a.last_message_at || 0).getTime();
          const timeB = new Date(b.last_message_at || 0).getTime();
          return timeB - timeA;
        });
      });
    };

    const handleConversationError = (error: ConversationSocketError) => {
      if (error.code !== DIRECT_MESSAGE_BLOCKED_CODE) return;
      if (error.conversation_id && error.conversation_id !== conversationId) return;

      toast.error(error.message || 'Direct messaging is unavailable for this conversation.');
      if (partnerUsername) {
        void queryClient.invalidateQueries({
          queryKey: conversationPartnerProfileQueryKey(partnerUsername),
        });
      }
    };

    const handleMessageRevoked = (event: MessageRevokedEvent) => {
      syncRevokedMessageCaches(queryClient, event);
      useMessageComposerStore.getState().clearReplyToMessage(event.message_id);
      void refreshRevokedMessageQueries(queryClient, event.conversation_id);
    };

    const handleMessageDeletedForMe = (event: MessageDeletedForMeEvent) => {
      syncDeletedMessageCaches(queryClient, event);
      clearDeletedMessageSelections(event);
      void refreshDeletedMessageQueries(queryClient, event);
    };

    socket.on('@conversation:receive', handleReceiveMessage);
    socket.on('@conversation:error', handleConversationError);
    socket.on('@message:revoked', handleMessageRevoked);
    socket.on('@message:deleted-for-me', handleMessageDeletedForMe);

    return () => {
      socket.off('@conversation:receive', handleReceiveMessage);
      socket.off('@conversation:error', handleConversationError);
      socket.off('@message:revoked', handleMessageRevoked);
      socket.off('@message:deleted-for-me', handleMessageDeletedForMe);
    };
  }, [socket, isConnected, queryClient, conversationId, partnerUsername]);

  const sendMessage = (payload: SendMessagePayload): Promise<boolean> => {
    if (!socket || !isConnected) {
      toast.error('Messaging is not connected. Your draft was kept.');
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      socket.timeout(10000).emit(
        '@conversation:send',
        payload,
        (timeoutError: Error | null, result?: ConversationSendAcknowledgement) => {
          if (timeoutError) {
            toast.error('Could not confirm that the message was sent. Your draft was kept.');
            resolve(false);
            return;
          }

          if (!result?.success) {
            if (result?.error?.code !== DIRECT_MESSAGE_BLOCKED_CODE) {
              toast.error(result?.error?.message || 'Could not send this message. Your draft was kept.');
            }
            resolve(false);
            return;
          }

          resolve(true);
        },
      );
    });
  };

  const emitTyping = (payload: { conversation_id: string, conversation_type: 'direct' | 'group', isTyping: boolean }) => {
    if (socket && isConnected) {
      const event = payload.isTyping ? '@conversation:typing_on' : '@conversation:typing_off';
      socket.emit(event, { conversation_id: payload.conversation_id, conversation_type: payload.conversation_type });
    }
  };

  return { sendMessage, emitTyping };
};
