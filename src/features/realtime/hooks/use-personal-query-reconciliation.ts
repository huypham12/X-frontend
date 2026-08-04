'use client';

import { useEffect, useRef } from 'react';
import { focusManager, useQueryClient } from '@tanstack/react-query';
import { selectIsSessionReady, useAuthStore } from '@/features/auth/stores/auth.store';
import { conversationKeys } from '@/features/conversations/constants/conversation-query-keys';
import { notificationKeys } from '@/features/notifications/constants/notification-query-keys';

const RECONCILIATION_COALESCE_MS = 250;

export const usePersonalQueryReconciliation = (isConnected: boolean) => {
  const queryClient = useQueryClient();
  const isSessionReady = useAuthStore(selectIsSessionReady);
  const currentUserId = useAuthStore((state) => state.user?._id ?? null);
  const lastReconciledAtRef = useRef(0);
  const reconciledUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSessionReady || !currentUserId) return;
    let disposed = false;
    if (reconciledUserIdRef.current !== currentUserId) {
      reconciledUserIdRef.current = currentUserId;
      lastReconciledAtRef.current = 0;
    }

    const reconcileActivePersonalQueries = () => {
      const currentSession = useAuthStore.getState();
      if (
        disposed ||
        !currentSession.isAuthenticated ||
        currentSession.user?._id !== currentUserId
      ) {
        return;
      }
      const now = Date.now();
      if (now - lastReconciledAtRef.current < RECONCILIATION_COALESCE_MS) return;
      lastReconciledAtRef.current = now;
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationKeys.feeds(),
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: notificationKeys.unread(),
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: conversationKeys.all,
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: conversationKeys.messageLists(),
          refetchType: 'active',
        }),
      ]);
    };

    if (isConnected) reconcileActivePersonalQueries();
    const unsubscribeFromFocus = focusManager.subscribe((isFocused) => {
      if (isFocused) reconcileActivePersonalQueries();
    });

    return () => {
      disposed = true;
      unsubscribeFromFocus();
    };
  }, [currentUserId, isConnected, isSessionReady, queryClient]);
};
