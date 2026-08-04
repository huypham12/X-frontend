'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import {
  captureAuthSession,
  isAuthSessionCurrent,
} from '@/features/auth/stores/auth.store';
import {
  applyNotificationReadState,
  applyNotificationRemoved,
  applyNotificationUnreadCount,
  hasCachedNotification,
  invalidateNotificationFeeds,
} from '../utils/notification-cache';
import type {
  NotificationReadStateEvent,
  NotificationRemovedEvent,
  NotificationSocketItem,
  NotificationUnreadCountEvent,
} from '../types/notification.type';

const MAX_RECENT_NOTIFICATION_EVENTS = 500;

const rememberEvent = (events: Map<string, string>, key: string, fingerprint: string) => {
  if (events.get(key) === fingerprint) return false;
  events.set(key, fingerprint);
  if (events.size > MAX_RECENT_NOTIFICATION_EVENTS) {
    const oldestKey = events.keys().next().value;
    if (oldestKey !== undefined) events.delete(oldestKey);
  }
  return true;
};

const notificationFingerprint = (notification: NotificationSocketItem) =>
  [
    notification.updated_at,
    notification.is_read ? 'read' : 'unread',
    notification.actor_count,
    notification.actor_ids_preview.join(','),
  ].join(':');

export const useNotificationSocketSync = (socket: Socket | null) => {
  const sessionRef = useRef(captureAuthSession());
  const queryClient = useQueryClient();
  const recentEventsRef = useRef(new Map<string, string>());

  useEffect(() => {
    recentEventsRef.current.clear();
    if (!socket) return;
    const recentEvents = recentEventsRef.current;

    const handleNewNotification = (notification: NotificationSocketItem) => {
      if (!isAuthSessionCurrent(sessionRef.current)) return;
      if (!notification?._id) return;
      if (
        !rememberEvent(
          recentEvents,
          `new:${notification._id}`,
          notificationFingerprint(notification),
        )
      ) {
        return;
      }
      void invalidateNotificationFeeds(queryClient);
    };

    const handleUnreadCount = (event: NotificationUnreadCountEvent) => {
      if (!isAuthSessionCurrent(sessionRef.current)) return;
      if (!Number.isSafeInteger(event?.version) || event.version < 0) return;
      applyNotificationUnreadCount(queryClient, event);
    };

    const handleReadState = (event: NotificationReadStateEvent) => {
      if (!isAuthSessionCurrent(sessionRef.current)) return;
      if (!Number.isSafeInteger(event?.version) || event.version < 0) return;
      const fingerprint = `${event.action}:${event.notification_id ?? 'all'}:${event.read_at}:${event.updated_count}:${event.version}`;
      if (!rememberEvent(recentEvents, 'read-state', fingerprint)) return;
      applyNotificationReadState(queryClient, event);
    };

    const handleUpdatedNotification = (notification: NotificationSocketItem) => {
      if (!isAuthSessionCurrent(sessionRef.current)) return;
      if (!notification?._id) return;
      if (
        !rememberEvent(
          recentEvents,
          `updated:${notification._id}`,
          notificationFingerprint(notification),
        )
      ) {
        return;
      }
      if (hasCachedNotification(queryClient, notification._id)) {
        void invalidateNotificationFeeds(queryClient);
      }
    };

    const handleRemovedNotification = (event: NotificationRemovedEvent) => {
      if (!isAuthSessionCurrent(sessionRef.current)) return;
      if (!event?.notification_id) return;
      const fingerprint = `${event.updated_at}:${event.version ?? 'none'}:${event.unread_count ?? 'none'}`;
      if (!rememberEvent(recentEvents, `removed:${event.notification_id}`, fingerprint)) return;
      applyNotificationRemoved(queryClient, event);
    };

    socket.on('@notification:new', handleNewNotification);
    socket.on('@notification:unread-count', handleUnreadCount);
    socket.on('@notification:read-state', handleReadState);
    socket.on('@notification:updated', handleUpdatedNotification);
    socket.on('@notification:removed', handleRemovedNotification);

    return () => {
      socket.off('@notification:new', handleNewNotification);
      socket.off('@notification:unread-count', handleUnreadCount);
      socket.off('@notification:read-state', handleReadState);
      socket.off('@notification:updated', handleUpdatedNotification);
      socket.off('@notification:removed', handleRemovedNotification);
    };
  }, [queryClient, socket]);
};
