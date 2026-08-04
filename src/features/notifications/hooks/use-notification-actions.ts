'use client';

import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications.api';
import {
  applyNotificationReadResult,
  invalidateNotificationFeeds,
  invalidateNotificationUnread,
} from '../utils/notification-cache';
import {
  captureAuthSession,
  isAuthSessionCurrent,
} from '@/features/auth/stores/auth.store';

export const useNotificationActions = () => {
  const queryClient = useQueryClient();
  const session = captureAuthSession();
  const pendingIdsRef = useRef(new Set<string>());
  const markAllPendingRef = useRef(false);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());

  const reconcileAfterError = useCallback(async () => {
    if (!isAuthSessionCurrent(session)) return;
    await Promise.all([
      invalidateNotificationFeeds(queryClient),
      invalidateNotificationUnread(queryClient),
    ]);
  }, [queryClient, session]);

  const markOneMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: async (result) => {
      if (!isAuthSessionCurrent(session)) return;
      applyNotificationReadResult(queryClient, result);
      await invalidateNotificationFeeds(queryClient);
    },
    onError: reconcileAfterError,
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: async (result) => {
      if (!isAuthSessionCurrent(session)) return;
      applyNotificationReadResult(queryClient, result);
      await invalidateNotificationFeeds(queryClient);
    },
    onError: reconcileAfterError,
  });

  const markOne = useCallback(
    (notificationId: string) => {
      if (markAllPendingRef.current || pendingIdsRef.current.has(notificationId)) return;

      markOneMutation.reset();
      pendingIdsRef.current.add(notificationId);
      setPendingIds(new Set(pendingIdsRef.current));
      markOneMutation.mutate(notificationId, {
        onSettled: () => {
          if (!isAuthSessionCurrent(session)) return;
          pendingIdsRef.current.delete(notificationId);
          setPendingIds(new Set(pendingIdsRef.current));
        },
      });
    },
    [markOneMutation, session],
  );

  const markAll = useCallback(() => {
    if (markAllPendingRef.current || pendingIdsRef.current.size > 0) return;

    markAllMutation.reset();
    markAllPendingRef.current = true;
    markAllMutation.mutate(undefined, {
      onSettled: () => {
        if (!isAuthSessionCurrent(session)) return;
        markAllPendingRef.current = false;
      },
    });
  }, [markAllMutation, session]);

  const resetActionError = useCallback(() => {
    markOneMutation.reset();
    markAllMutation.reset();
  }, [markAllMutation, markOneMutation]);

  return {
    markOne,
    markAll,
    pendingIds,
    isMarkAllPending: markAllMutation.isPending,
    hasPendingMarkOne: pendingIds.size > 0,
    actionError: markOneMutation.error ?? markAllMutation.error,
    resetActionError,
  };
};
