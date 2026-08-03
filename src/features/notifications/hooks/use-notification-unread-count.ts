'use client';

import { useQuery } from '@tanstack/react-query';
import { selectIsSessionReady, useAuthStore } from '@/features/auth/stores/auth.store';
import { keepNewestVersionedState } from '@/utils/versioned-state';
import { notificationsApi } from '../api/notifications.api';
import { notificationKeys } from '../constants/notification-query-keys';

export const useNotificationUnreadCount = () => {
  const isSessionReady = useAuthStore(selectIsSessionReady);

  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: notificationsApi.getUnreadCount,
    enabled: isSessionReady,
    structuralSharing: keepNewestVersionedState,
  });
};
