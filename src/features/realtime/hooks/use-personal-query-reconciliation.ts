'use client';

import { useEffect } from 'react';
import { focusManager, useQueryClient } from '@tanstack/react-query';
import { selectIsSessionReady, useAuthStore } from '@/features/auth/stores/auth.store';
import { conversationKeys } from '@/features/conversations/constants/conversation-query-keys';
import { notificationKeys } from '@/features/notifications/constants/notification-query-keys';

export const usePersonalQueryReconciliation = (isConnected: boolean) => {
  const queryClient = useQueryClient();
  const isSessionReady = useAuthStore(selectIsSessionReady);

  useEffect(() => {
    if (!isSessionReady) return;

    const reconcileActivePersonalQueries = () => {
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
    return focusManager.subscribe((isFocused) => {
      if (isFocused) reconcileActivePersonalQueries();
    });
  }, [isConnected, isSessionReady, queryClient]);
};
