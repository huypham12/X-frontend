import { apiClient } from '@/services/api.client';
import type {
  MarkAllNotificationsReadResult,
  MarkNotificationReadResult,
  NotificationApiResponse,
  NotificationPageData,
  NotificationPageRequest,
  NotificationUnreadState,
} from '../types/notification.type';

const DEFAULT_NOTIFICATION_PAGE_LIMIT = 10;

export const notificationsApi = {
  getNotifications: async (
    request: NotificationPageRequest = {},
  ): Promise<NotificationPageData> => {
    const response = await apiClient.get<NotificationApiResponse<NotificationPageData>>(
      '/notifications',
      {
        params: {
          limit: request.limit ?? DEFAULT_NOTIFICATION_PAGE_LIMIT,
          ...(request.cursor ? { cursor: request.cursor } : {}),
        },
      },
    );

    return response.data.data;
  },

  getUnreadCount: async (): Promise<NotificationUnreadState> => {
    const response = await apiClient.get<NotificationApiResponse<NotificationUnreadState>>(
      '/notifications/unread-count',
    );
    return response.data.data;
  },

  markAsRead: async (notificationId: string): Promise<MarkNotificationReadResult> => {
    const response = await apiClient.post<NotificationApiResponse<MarkNotificationReadResult>>(
      `/notifications/${notificationId}/read`,
    );
    return response.data.data;
  },

  markAllAsRead: async (): Promise<MarkAllNotificationsReadResult> => {
    const response = await apiClient.post<
      NotificationApiResponse<MarkAllNotificationsReadResult>
    >('/notifications/read-all');
    return response.data.data;
  },
};
