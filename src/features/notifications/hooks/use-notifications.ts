'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { selectIsSessionReady, useAuthStore } from '@/features/auth/stores/auth.store';
import { notificationsApi } from '../api/notifications.api';
import { notificationKeys } from '../constants/notification-query-keys';

export const NOTIFICATION_PAGE_LIMIT = 10;

export const useNotifications = () => {
  const isSessionReady = useAuthStore(selectIsSessionReady);

  return useInfiniteQuery({
    queryKey: notificationKeys.feed(NOTIFICATION_PAGE_LIMIT),
    queryFn: ({ pageParam }) =>
      notificationsApi.getNotifications({
        limit: NOTIFICATION_PAGE_LIMIT,
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_next_page && lastPage.next_cursor
        ? lastPage.next_cursor
        : undefined,
    enabled: isSessionReady,
  });
};
