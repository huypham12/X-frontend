import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { notificationKeys } from '../constants/notification-query-keys';
import type {
  NotificationPageData,
  NotificationReadStateEvent,
  NotificationRemovedEvent,
  NotificationUnreadCountEvent,
  NotificationUnreadState,
} from '../types/notification.type';

type NotificationFeedData = InfiniteData<NotificationPageData>;

const updateUnreadState = (
  queryClient: QueryClient,
  unreadCount: number,
  version: number,
  updatedAt: string,
) => {
  const wasFetching =
    queryClient.isFetching({ queryKey: notificationKeys.unread(), exact: true }) > 0;
  void queryClient.cancelQueries(
    { queryKey: notificationKeys.unread(), exact: true },
    { revert: false },
  );
  let wasMissing = false;
  queryClient.setQueryData<NotificationUnreadState>(notificationKeys.unread(), (current) => {
    if (!current) {
      wasMissing = true;
      return { unreadCount, version, updated_at: updatedAt };
    }
    if (version <= current.version) return current;
    return { unreadCount, version, updated_at: updatedAt };
  });
  if (wasMissing || wasFetching) void invalidateNotificationUnread(queryClient);
};

export const invalidateNotificationFeeds = (queryClient: QueryClient) => {
  void queryClient.cancelQueries(
    { queryKey: notificationKeys.feeds() },
    { revert: false },
  );
  return queryClient.invalidateQueries({
    queryKey: notificationKeys.feeds(),
    refetchType: 'active',
  });
};

export const invalidateNotificationUnread = (queryClient: QueryClient) => {
  void queryClient.cancelQueries(
    { queryKey: notificationKeys.unread(), exact: true },
    { revert: false },
  );
  return queryClient.invalidateQueries({
    queryKey: notificationKeys.unread(),
    refetchType: 'active',
  });
};

export const hasCachedNotification = (queryClient: QueryClient, notificationId: string) =>
  queryClient
    .getQueriesData<NotificationFeedData>({ queryKey: notificationKeys.feeds() })
    .some(([, data]) =>
      data?.pages.some((page) =>
        page.notifications.some((notification) => notification._id === notificationId),
      ),
    );

export const applyNotificationUnreadCount = (
  queryClient: QueryClient,
  event: NotificationUnreadCountEvent,
) => {
  updateUnreadState(queryClient, event.unread_count, event.version, event.updated_at);
};

export const applyNotificationReadState = (
  queryClient: QueryClient,
  event: NotificationReadStateEvent,
) => {
  updateUnreadState(queryClient, event.unread_count, event.version, event.read_at);

  if (event.action === 'read_all') {
    void invalidateNotificationFeeds(queryClient);
    return;
  }
  if (!event.notification_id || event.updated_count !== 1) return;

  const wasFetching = queryClient.isFetching({ queryKey: notificationKeys.feeds() }) > 0;
  void queryClient.cancelQueries(
    { queryKey: notificationKeys.feeds() },
    { revert: false },
  );
  const readAtTimestamp = Date.parse(event.read_at);
  let requiresFeedReconciliation = !Number.isFinite(readAtTimestamp);

  queryClient.setQueriesData<NotificationFeedData>(
    { queryKey: notificationKeys.feeds() },
    (data) => {
      if (!data) return data;
      let changed = false;
      const pages = data.pages.map((page) => ({
        ...page,
        notifications: page.notifications.map((notification) => {
          if (notification._id !== event.notification_id) {
            return notification;
          }

          if (!Number.isFinite(readAtTimestamp)) return notification;

          const notificationUpdatedAt = Date.parse(notification.updated_at);
          if (
            !Number.isFinite(notificationUpdatedAt) ||
            notificationUpdatedAt > readAtTimestamp
          ) {
            requiresFeedReconciliation = true;
            return notification;
          }

          const currentReadAt = notification.read_at
            ? Date.parse(notification.read_at)
            : Number.NaN;
          if (
            notification.is_read &&
            Number.isFinite(currentReadAt) &&
            currentReadAt >= readAtTimestamp
          ) {
            return notification;
          }

          changed = true;
          return {
            ...notification,
            is_read: true,
            read_at: event.read_at,
            updated_at: event.read_at,
          };
        }),
      }));
      return changed ? { ...data, pages } : data;
    },
  );

  if (requiresFeedReconciliation || wasFetching) {
    void invalidateNotificationFeeds(queryClient);
  }
};

export const applyNotificationRemoved = (
  queryClient: QueryClient,
  event: NotificationRemovedEvent,
) => {
  const wasFetching = queryClient.isFetching({ queryKey: notificationKeys.feeds() }) > 0;
  void queryClient.cancelQueries(
    { queryKey: notificationKeys.feeds() },
    { revert: false },
  );
  queryClient.setQueriesData<NotificationFeedData>(
    { queryKey: notificationKeys.feeds() },
    (data) => {
      if (!data) return data;
      let changed = false;
      const pages = data.pages.map((page) => {
        const notifications = page.notifications.filter(
          (notification) => notification._id !== event.notification_id,
        );
        if (notifications.length !== page.notifications.length) changed = true;
        return notifications === page.notifications ? page : { ...page, notifications };
      });
      return changed ? { ...data, pages } : data;
    },
  );

  if (event.version !== undefined && event.unread_count !== undefined) {
    updateUnreadState(queryClient, event.unread_count, event.version, event.updated_at);
  } else {
    void invalidateNotificationUnread(queryClient);
  }

  if (wasFetching) void invalidateNotificationFeeds(queryClient);
};
