export const notificationKeys = {
  all: ['notifications'] as const,
  feeds: () => [...notificationKeys.all, 'feed'] as const,
  feed: (limit: number = 10) => [...notificationKeys.feeds(), { limit }] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};
