import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/providers/socket-provider';
import { toast } from 'sonner';
import { conversationPartnerProfileQueryKey } from './use-conversation-partner-profile';
import type {
  MessageDeletedForMeEvent,
  MessageReactionUpdatedEvent,
  MessageRevokedEvent,
} from '../types/message-action.type';
import {
  clearDeletedMessageSelections,
  MESSAGE_REACTION_DETAILS_QUERY_KEY,
  refreshDeletedMessageQueries,
  refreshRevokedMessageQueries,
  syncReactionUpdatedCaches,
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

    const handleMessageReactionUpdated = (event: MessageReactionUpdatedEvent) => {
      syncReactionUpdatedCaches(queryClient, event);
      void queryClient.invalidateQueries({
        queryKey: MESSAGE_REACTION_DETAILS_QUERY_KEY(event.message_id),
        refetchType: 'active',
      });
    };

    socket.on('@conversation:error', handleConversationError);
    socket.on('@message:revoked', handleMessageRevoked);
    socket.on('@message:deleted-for-me', handleMessageDeletedForMe);
    socket.on('@message:reaction-updated', handleMessageReactionUpdated);

    return () => {
      socket.off('@conversation:error', handleConversationError);
      socket.off('@message:revoked', handleMessageRevoked);
      socket.off('@message:deleted-for-me', handleMessageDeletedForMe);
      socket.off('@message:reaction-updated', handleMessageReactionUpdated);
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
