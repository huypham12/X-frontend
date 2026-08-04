import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/providers/socket-provider';
import {
  captureAuthSession,
  isAuthSessionCurrent,
} from '@/features/auth/stores/auth.store';
import { toast } from 'sonner';
import { conversationPartnerProfileQueryKey } from './use-conversation-partner-profile';
import type {
  PendingMessageOperation,
  PendingSendStatus,
  SendMessageDraft,
  SendMessagePayload,
  SendMessageResult,
} from '../types/pending-message.type';
import { MESSAGES_QUERY_KEY } from './use-messages';
import {
  hasCommittedMessage,
  reconcileSendAcknowledgement,
  type MessageInfiniteData,
} from '../utils/message-idempotency';

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

const DIRECT_MESSAGE_BLOCKED_CODE = 'DIRECT_MESSAGE_BLOCKED';
const CLIENT_MESSAGE_ID_CONFLICT_CODE = 'CLIENT_MESSAGE_ID_CONFLICT';
const SEND_TIMEOUT_MESSAGE =
  'Could not confirm that the message was sent. Retry to safely check the same send operation.';

const createClientMessageId = () => `web:${crypto.randomUUID()}`;

const isConflictError = (error?: ConversationSocketError) =>
  error?.code === CLIENT_MESSAGE_ID_CONFLICT_CODE;

export const useChatSocket = (conversationId?: string, partnerUsername?: string) => {
  const sessionRef = useRef(captureAuthSession());
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const operationRef = useRef<PendingMessageOperation | null>(null);
  const inFlightPromiseRef = useRef<Promise<SendMessageResult> | null>(null);
  const [pendingOperation, setPendingOperation] = useState<PendingMessageOperation | null>(null);

  const updateOperation = useCallback((operation: PendingMessageOperation | null) => {
    if (!isAuthSessionCurrent(sessionRef.current)) return;
    operationRef.current = operation;
    setPendingOperation(operation);
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleConversationError = (error: ConversationSocketError) => {
      if (!isAuthSessionCurrent(sessionRef.current)) return;
      if (error.code !== DIRECT_MESSAGE_BLOCKED_CODE) return;
      if (error.conversation_id && error.conversation_id !== conversationId) return;

      toast.error(error.message || 'Direct messaging is unavailable for this conversation.');
      if (partnerUsername) {
        void queryClient.invalidateQueries({
          queryKey: conversationPartnerProfileQueryKey(partnerUsername),
        });
      }
    };

    socket.on('@conversation:error', handleConversationError);

    return () => {
      socket.off('@conversation:error', handleConversationError);
    };
  }, [socket, isConnected, queryClient, conversationId, partnerUsername]);

  const emitOperation = useCallback(
    (operation: PendingMessageOperation): Promise<SendMessageResult> => {
      if (!isAuthSessionCurrent(sessionRef.current)) {
        return Promise.resolve({
          status: 'not_sent',
          clientMessageId: operation.clientMessageId,
          errorMessage: 'This send belongs to a previous signed-in session.',
        });
      }

      const sendingOperation = { ...operation, status: 'sending' as const, errorMessage: undefined };
      updateOperation(sendingOperation);

      if (!socket || !isConnected) {
        const failedOperation = {
          ...operation,
          status: 'not_sent' as const,
          errorMessage: 'Messaging is not connected. This message was not sent and your draft was kept.',
        };
        updateOperation(failedOperation);
        return Promise.resolve({
          status: failedOperation.status,
          clientMessageId: operation.clientMessageId,
          errorMessage: failedOperation.errorMessage,
        });
      }

      return new Promise((resolve) => {
        socket.timeout(10000).emit(
          '@conversation:send',
          operation.payload,
          (timeoutError: Error | null, result?: ConversationSendAcknowledgement) => {
            if (!isAuthSessionCurrent(sessionRef.current)) {
              resolve({
                status: 'not_sent',
                clientMessageId: operation.clientMessageId,
                errorMessage: 'This send belongs to a previous signed-in session.',
              });
              return;
            }

            if (timeoutError) {
              const failedOperation = {
                ...operation,
                status: 'failed_to_confirm' as const,
                errorMessage: SEND_TIMEOUT_MESSAGE,
              };
              updateOperation(failedOperation);
              resolve({
                status: failedOperation.status,
                clientMessageId: operation.clientMessageId,
                errorMessage: failedOperation.errorMessage,
              });
              return;
            }

            if (!result?.success || !result.message_id) {
              const conflict = isConflictError(result?.error);
              const status: PendingSendStatus = conflict ? 'conflict' : 'failed';
              const errorMessage = conflict
                ? 'This send operation conflicts with a different committed payload. Edit it to start a new operation.'
                : result?.error?.message || 'Could not send this message. Your draft was kept.';
              const failedOperation = { ...operation, status, errorMessage };
              updateOperation(failedOperation);
              if (result?.error?.code === DIRECT_MESSAGE_BLOCKED_CODE) {
                toast.error(errorMessage);
              }
              resolve({
                status: failedOperation.status,
                clientMessageId: operation.clientMessageId,
                errorMessage,
              });
              return;
            }

            const messagesKey = MESSAGES_QUERY_KEY(operation.payload.conversation_id);
            const cachedMessages = queryClient.getQueryData<MessageInfiniteData>(messagesKey);
            const alreadyCommitted = hasCommittedMessage(
              cachedMessages,
              result.message_id,
              operation.clientMessageId,
            );
            queryClient.setQueryData<MessageInfiniteData>(messagesKey, (currentData) =>
              reconcileSendAcknowledgement(
                currentData,
                result.message_id as string,
                operation.clientMessageId,
              ),
            );
            if (!alreadyCommitted) {
              void queryClient.invalidateQueries({
                queryKey: messagesKey,
                exact: true,
                refetchType: 'active',
              });
            }

            updateOperation(null);
            resolve({
              status: 'committed',
              clientMessageId: operation.clientMessageId,
              messageId: result.message_id,
            });
          },
        );
      });
    },
    [isConnected, queryClient, socket, updateOperation],
  );

  const runOperation = useCallback(
    (operation: PendingMessageOperation) => {
      if (inFlightPromiseRef.current) return inFlightPromiseRef.current;

      const request = emitOperation(operation);
      inFlightPromiseRef.current = request;
      void request.finally(() => {
        if (inFlightPromiseRef.current === request) inFlightPromiseRef.current = null;
      });
      return request;
    },
    [emitOperation],
  );

  const sendMessage = useCallback(
    (draft: SendMessageDraft): Promise<SendMessageResult> => {
      if (!isAuthSessionCurrent(sessionRef.current)) {
        const clientMessageId = createClientMessageId();
        return Promise.resolve({
          status: 'not_sent',
          clientMessageId,
          errorMessage: 'This send belongs to a previous signed-in session.',
        });
      }

      const currentOperation = operationRef.current;
      if (currentOperation) return runOperation(currentOperation);

      const clientMessageId = createClientMessageId();
      const payload: SendMessagePayload = {
        ...draft,
        media_ids: draft.media_ids ? [...draft.media_ids] : undefined,
        mention_user_ids: draft.mention_user_ids ? [...draft.mention_user_ids] : undefined,
        client_message_id: clientMessageId,
      };
      const operation: PendingMessageOperation = {
        clientMessageId,
        payload,
        status: 'sending',
      };
      operationRef.current = operation;
      return runOperation(operation);
    },
    [runOperation],
  );

  const retryPendingMessage = useCallback(() => {
    if (!isAuthSessionCurrent(sessionRef.current)) {
      return Promise.resolve<SendMessageResult | null>(null);
    }
    const operation = operationRef.current;
    if (!operation) return Promise.resolve<SendMessageResult | null>(null);
    return runOperation(operation);
  }, [runOperation]);

  const abandonPendingMessage = useCallback(() => {
    if (!isAuthSessionCurrent(sessionRef.current)) return;
    const status = operationRef.current?.status;
    if (!status || status === 'sending' || status === 'failed_to_confirm') return;
    updateOperation(null);
  }, [updateOperation]);

  const emitTyping = (payload: { conversation_id: string, conversation_type: 'direct' | 'group', isTyping: boolean }) => {
    if (socket && isConnected && isAuthSessionCurrent(sessionRef.current)) {
      const event = payload.isTyping ? '@conversation:typing_on' : '@conversation:typing_off';
      socket.emit(event, { conversation_id: payload.conversation_id, conversation_type: payload.conversation_type });
    }
  };

  return {
    sendMessage,
    retryPendingMessage,
    abandonPendingMessage,
    pendingOperation,
    emitTyping,
  };
};
