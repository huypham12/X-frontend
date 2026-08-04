'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/providers/socket-provider';
import {
  invalidateNotificationFeeds,
  invalidateNotificationUnread,
} from '@/features/notifications/utils/notification-cache';
import { conversationsApi } from '../api/conversations.api';
import { conversationKeys, CONVERSATIONS_QUERY_KEY } from '../constants/conversation-query-keys';
import { useConversationDetailsStore } from '../stores/conversation-details.store';
import { useMessageComposerStore } from '../stores/message-composer.store';
import type {
  ConversationReadAcknowledgement,
  ConversationReadErrorAcknowledgement,
  ConversationReadResult,
} from '../types/conversation-unread.type';
import {
  applyConversationReadResult,
  removeConversationCaches,
} from '../utils/conversation-cache';

type ConversationReadSocketResult =
  | ConversationReadAcknowledgement
  | ConversationReadErrorAcknowledgement;

const READ_ACK_TIMEOUT_MS = 5000;
const ACCESS_DENIED_CODES = new Set([
  'CONVERSATION_ACCESS_DENIED',
  'CONVERSATION_MEMBERSHIP_REQUIRED',
  'FORBIDDEN',
]);

const isPageActive = () =>
  document.visibilityState === 'visible' && document.hasFocus();

type ConversationReadAttemptStatus = 'pending' | 'acknowledged' | 'failed' | 'denied';

interface ConversationReadAttempt {
  conversationId: string;
  messageId: string;
  status: ConversationReadAttemptStatus;
}

export const useConversationRead = (conversationId: string) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const router = useRouter();
  const activeConversationIdRef = useRef(conversationId);
  const queuedMessageIdRef = useRef<string | null>(null);
  const lastAcknowledgedMessageIdRef = useRef<string | null>(null);
  const isCommandPendingRef = useRef(false);
  const isMountedRef = useRef(true);
  const commandGenerationRef = useRef(0);
  const [latestAttempt, setLatestAttempt] = useState<ConversationReadAttempt | null>(null);

  useEffect(() => {
    activeConversationIdRef.current = conversationId;
    commandGenerationRef.current += 1;
    queuedMessageIdRef.current = null;
    lastAcknowledgedMessageIdRef.current = null;
    isCommandPendingRef.current = false;
  }, [conversationId]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const reconcileAuthoritativeState = useCallback(
    (result: ConversationReadAcknowledgement | ConversationReadResult) => {
      const didApply = applyConversationReadResult(queryClient, result);
      if (!didApply) {
        void queryClient.invalidateQueries({
          queryKey: conversationKeys.unreadSummary(),
          refetchType: 'active',
        });
        void queryClient.invalidateQueries({
          queryKey: CONVERSATIONS_QUERY_KEY,
          exact: true,
          refetchType: 'active',
        });
      }

      // The backend owns directed-notification invalidation. Refetching here is
      // reconciliation only; the client never infers which notification to remove.
      void invalidateNotificationFeeds(queryClient);
      void invalidateNotificationUnread(queryClient);
    },
    [queryClient],
  );

  const handleMembershipLoss = useCallback(
    async (targetConversationId: string) => {
      if (activeConversationIdRef.current !== targetConversationId) return;

      const details = useConversationDetailsStore.getState();
      if (details.openConversationId === targetConversationId) details.closeDetails();
      const composer = useMessageComposerStore.getState();
      if (composer.conversationId === targetConversationId) composer.clearReply();

      await removeConversationCaches(queryClient, targetConversationId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: conversationKeys.unreadSummary() }),
      ]);
      if (activeConversationIdRef.current === targetConversationId) router.replace('/messages');
    },
    [queryClient, router],
  );

  const runReadCommand = useCallback(
    async (messageId: string) => {
      const targetConversationId = conversationId;

      if (socket && isConnected) {
        const socketResult = await new Promise<
          | { kind: 'ack'; result: ConversationReadSocketResult }
          | { kind: 'fallback' }
        >((resolve) => {
          socket.timeout(READ_ACK_TIMEOUT_MS).emit(
            '@conversation:read',
            { conversation_id: targetConversationId, message_id: messageId },
            (timeoutError: Error | null, result?: ConversationReadSocketResult) => {
              if (timeoutError || !result) {
                resolve({ kind: 'fallback' });
                return;
              }
              resolve({ kind: 'ack', result });
            },
          );
        });

        if (socketResult.kind === 'ack' && socketResult.result.success) {
          reconcileAuthoritativeState(socketResult.result);
          return 'acknowledged' as const;
        }

        if (
          socketResult.kind === 'ack' &&
          !socketResult.result.success &&
          socketResult.result.error?.code &&
          ACCESS_DENIED_CODES.has(socketResult.result.error.code)
        ) {
          await handleMembershipLoss(targetConversationId);
          return 'denied' as const;
        }

        if (socketResult.kind === 'ack') return 'failed' as const;
      }

      try {
        const result = await conversationsApi.markAsRead(targetConversationId, {
          message_id: messageId,
        });
        reconcileAuthoritativeState(result);
        return 'acknowledged' as const;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          await handleMembershipLoss(targetConversationId);
          return 'denied' as const;
        }

        void queryClient.invalidateQueries({
          queryKey: conversationKeys.unreadSummary(),
          refetchType: 'active',
        });
        void queryClient.invalidateQueries({
          queryKey: CONVERSATIONS_QUERY_KEY,
          exact: true,
          refetchType: 'active',
        });
        return 'failed' as const;
      }
    },
    [conversationId, handleMembershipLoss, isConnected, queryClient, reconcileAuthoritativeState, socket],
  );

  const drainQueue = useCallback(async () => {
    if (isCommandPendingRef.current || !isPageActive()) return;
    isCommandPendingRef.current = true;
    const targetConversationId = conversationId;
    const commandGeneration = commandGenerationRef.current;

    try {
      while (
        isMountedRef.current &&
        commandGenerationRef.current === commandGeneration &&
        activeConversationIdRef.current === targetConversationId &&
        queuedMessageIdRef.current &&
        isPageActive()
      ) {
        const messageId = queuedMessageIdRef.current;
        queuedMessageIdRef.current = null;
        if (messageId === lastAcknowledgedMessageIdRef.current) continue;

        const result = await runReadCommand(messageId);
        if (result === 'acknowledged') {
          lastAcknowledgedMessageIdRef.current = messageId;
        }
        if (result === 'denied') queuedMessageIdRef.current = null;
        if (
          isMountedRef.current &&
          commandGenerationRef.current === commandGeneration &&
          activeConversationIdRef.current === targetConversationId
        ) {
          setLatestAttempt({
            conversationId: targetConversationId,
            messageId,
            status: result,
          });
        }
      }
    } finally {
      if (commandGenerationRef.current === commandGeneration) {
        isCommandPendingRef.current = false;
      }
    }
  }, [conversationId, runReadCommand]);

  const acknowledgeVisibleMessage = useCallback(
    (messageId: string) => {
      if (!messageId || !isPageActive()) return;
      if (messageId === lastAcknowledgedMessageIdRef.current) {
        setLatestAttempt({ conversationId, messageId, status: 'acknowledged' });
        return;
      }
      setLatestAttempt({ conversationId, messageId, status: 'pending' });
      queuedMessageIdRef.current = messageId;
      void drainQueue();
    },
    [conversationId, drainQueue],
  );

  return {
    acknowledgeVisibleMessage,
    latestAttempt:
      latestAttempt?.conversationId === conversationId ? latestAttempt : null,
  };
};
