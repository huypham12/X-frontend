'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { BellOff, RotateCcw } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { useNotifications } from '../hooks/use-notifications';
import { flattenNotifications } from '../utils/notification-presentation';
import { NotificationItem } from './notification-item';

interface NotificationFeedProps {
  pendingIds: ReadonlySet<string>;
  isMarkAllPending: boolean;
  onMarkRead: (notificationId: string) => void;
}

const NotificationFeedSkeleton = () => (
  <div aria-hidden="true">
    {Array.from({ length: 5 }, (_, index) => (
      <div key={index} className="flex gap-3 border-b border-[#2F3336] p-4">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[#181818] motion-reduce:animate-none" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-[#181818] motion-reduce:animate-none" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-[#181818] motion-reduce:animate-none" />
          <div className="h-14 animate-pulse rounded-xl bg-[#181818] motion-reduce:animate-none" />
        </div>
      </div>
    ))}
  </div>
);

export const NotificationFeed = ({
  pendingIds,
  isMarkAllPending,
  onMarkRead,
}: NotificationFeedProps) => {
  const { ref: loadMoreRef, inView } = useInView({ rootMargin: '320px 0px' });
  const {
    data,
    isPending,
    isError,
    isRefetchError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useNotifications();
  const notifications = useMemo(() => flattenNotifications(data?.pages), [data?.pages]);
  const notificationIds = useMemo(
    () => notifications.map((notification) => notification._id),
    [notifications],
  );
  const previousNotificationIdsRef = useRef<string[]>([]);
  const focusedNotificationIdRef = useRef<string | null>(null);
  const notificationRowsRef = useRef(new Map<string, HTMLLIElement>());
  const emptyStateRef = useRef<HTMLDivElement>(null);
  const focusStatusRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!inView || !hasNextPage || isFetchingNextPage || isFetchNextPageError) return;
    void fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    inView,
    isFetchNextPageError,
    isFetchingNextPage,
  ]);

  useLayoutEffect(() => {
    const previousIds = previousNotificationIdsRef.current;
    previousNotificationIdsRef.current = notificationIds;
    const focusedId = focusedNotificationIdRef.current;
    if (!focusedId || notificationIds.includes(focusedId)) return;
    if (!document.hasFocus()) {
      focusedNotificationIdRef.current = null;
      return;
    }

    const removedIndex = previousIds.indexOf(focusedId);
    const nextFocusId =
      removedIndex >= 0
        ? notificationIds[Math.min(removedIndex, notificationIds.length - 1)]
        : undefined;
    const nextRow = nextFocusId ? notificationRowsRef.current.get(nextFocusId) : undefined;
    const nextControl = nextRow?.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );

    if (nextControl || nextRow) {
      (nextControl ?? nextRow)?.focus();
      focusedNotificationIdRef.current = nextFocusId ?? null;
      if (focusStatusRef.current) {
        focusStatusRef.current.textContent = 'Notification removed. Focus moved to the next item.';
      }
      return;
    }

    emptyStateRef.current?.focus();
    focusedNotificationIdRef.current = null;
    if (focusStatusRef.current) {
      focusStatusRef.current.textContent = 'Notification removed. No notifications remain.';
    }
  }, [notificationIds]);

  const focusStatus = (
    <span ref={focusStatusRef} className="sr-only" aria-live="polite" aria-atomic="true" />
  );

  if (isPending) {
    return (
      <div role="status" aria-busy="true" aria-label="Đang tải thông báo">
        <NotificationFeedSkeleton />
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div
        role="alert"
        className="flex min-h-72 flex-col items-center justify-center px-6 text-center"
      >
        <p className="font-semibold text-white">Không thể tải thông báo</p>
        <p className="mt-2 text-sm text-gray-500">Kiểm tra kết nối rồi thử lại.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-5 flex min-h-11 items-center gap-2 rounded-full border border-[#536471] px-5 text-sm font-semibold text-white hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Thử lại
        </button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div>
        {focusStatus}
        {isRefetchError && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 border-b border-[#2F3336] bg-[#121212] px-4 py-3 text-sm text-gray-300"
          >
            <span>Không thể xác nhận dữ liệu thông báo mới nhất.</span>
            <button
              type="button"
              onClick={() => void refetch()}
              className="min-h-11 shrink-0 rounded-full px-4 font-semibold text-[#1d9bf0] hover:bg-[#1d9bf0]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9bf0]"
            >
              Thử lại
            </button>
          </div>
        )}
        <div
          ref={emptyStateRef}
          tabIndex={-1}
          className="flex min-h-72 flex-col items-center justify-center px-6 text-center outline-none"
        >
          <BellOff className="h-8 w-8 text-gray-500" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-white">Chưa có thông báo</h2>
          <p className="mt-2 max-w-sm text-sm leading-5 text-gray-500">
            Hoạt động liên quan đến tài khoản của bạn sẽ xuất hiện tại đây.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div aria-busy={isFetching || undefined}>
      {focusStatus}
      {isRefetchError && !isFetchNextPageError && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 border-b border-[#2F3336] bg-[#121212] px-4 py-3 text-sm text-gray-300"
        >
          <span>Không thể đồng bộ dữ liệu mới nhất.</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="min-h-11 shrink-0 rounded-full px-4 font-semibold text-[#1d9bf0] hover:bg-[#1d9bf0]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9bf0]"
          >
            Thử lại
          </button>
        </div>
      )}

      <ul
        aria-label="Danh sách thông báo"
        onBlurCapture={(event) => {
          const nextFocusedElement = event.relatedTarget;
          if (
            nextFocusedElement instanceof Node &&
            event.currentTarget.contains(nextFocusedElement)
          ) {
            return;
          }
          if (nextFocusedElement !== null) focusedNotificationIdRef.current = null;
        }}
      >
        {notifications.map((notification) => (
          <li
            key={notification._id}
            ref={(node) => {
              if (node) notificationRowsRef.current.set(notification._id, node);
              else notificationRowsRef.current.delete(notification._id);
            }}
            tabIndex={-1}
            onFocusCapture={() => {
              focusedNotificationIdRef.current = notification._id;
            }}
          >
            <NotificationItem
              notification={notification}
              isMarkPending={pendingIds.has(notification._id)}
              isMarkAllPending={isMarkAllPending}
              onMarkRead={onMarkRead}
            />
          </li>
        ))}
      </ul>

      <div ref={loadMoreRef} className="flex min-h-16 items-center justify-center px-4 py-3">
        {isFetchingNextPage && (
          <div aria-label="Đang tải thêm thông báo" className="w-full space-y-2">
            <div aria-hidden="true" className="h-3 w-2/3 animate-pulse rounded bg-[#181818] motion-reduce:animate-none" />
            <div aria-hidden="true" className="h-3 w-1/3 animate-pulse rounded bg-[#181818] motion-reduce:animate-none" />
          </div>
        )}

        {isFetchNextPageError && (
          <div role="status" className="text-center">
            <p className="text-sm text-gray-500">Không thể tải thêm thông báo.</p>
            <button
              type="button"
              onClick={() => void fetchNextPage()}
              className="mt-2 min-h-11 rounded-full px-5 text-sm font-semibold text-[#1d9bf0] hover:bg-[#1d9bf0]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9bf0]"
            >
              Thử lại
            </button>
          </div>
        )}

        {!hasNextPage && !isFetchNextPageError && (
          <p className="text-sm text-gray-600">Bạn đã xem hết thông báo.</p>
        )}
      </div>
    </div>
  );
};
