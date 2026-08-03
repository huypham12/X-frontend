'use client';

import { useEffect, useRef } from 'react';
import { CheckCheck, LoaderCircle, X } from 'lucide-react';
import { useNotificationUnreadCount } from '../hooks/use-notification-unread-count';
import { useNotificationActions } from '../hooks/use-notification-actions';
import { NotificationFeed } from './notification-feed';

export const NotificationPage = () => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { data: unreadState } = useNotificationUnreadCount();
  const {
    markOne,
    markAll,
    pendingIds,
    isMarkAllPending,
    hasPendingMarkOne,
    actionError,
    resetActionError,
  } = useNotificationActions();
  const canMarkAll =
    unreadState !== undefined &&
    unreadState.unreadCount > 0 &&
    !isMarkAllPending &&
    !hasPendingMarkOne;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section aria-labelledby="notifications-heading" className="min-h-screen bg-black">
      <header className="sticky top-10 z-20 flex min-h-[64px] items-center justify-between gap-4 border-b border-[#2F3336] bg-black/90 px-4 py-3 backdrop-blur-md lg:top-0">
        <div>
          <h1
            ref={headingRef}
            id="notifications-heading"
            tabIndex={-1}
            className="text-xl font-bold text-white outline-none"
          >
            Thông báo
          </h1>
          {unreadState && (
            <p className="mt-0.5 text-xs text-gray-500">
              {unreadState.unreadCount > 0
                ? `${unreadState.unreadCount} thông báo chưa đọc`
                : 'Không có thông báo chưa đọc'}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={markAll}
          disabled={!canMarkAll}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold text-[#1d9bf0] transition-colors hover:bg-[#1d9bf0]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9bf0] disabled:cursor-not-allowed disabled:text-gray-600 disabled:hover:bg-transparent"
        >
          {isMarkAllPending ? (
            <LoaderCircle
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
          )}
          {isMarkAllPending ? 'Đang cập nhật' : 'Đọc tất cả'}
        </button>
      </header>

      {actionError && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 border-b border-[#2F3336] bg-[#181818] px-4 py-3 text-sm text-gray-200"
        >
          <span>Không thể cập nhật trạng thái đọc. Dữ liệu đang được đối soát lại.</span>
          <button
            type="button"
            onClick={resetActionError}
            aria-label="Đóng thông báo lỗi"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <NotificationFeed
        pendingIds={pendingIds}
        isMarkAllPending={isMarkAllPending}
        onMarkRead={markOne}
      />
    </section>
  );
};
