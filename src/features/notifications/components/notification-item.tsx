'use client';

import { useMemo } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useConversationDetailsStore } from '@/features/conversations/stores/conversation-details.store';
import type { NotificationListItem } from '../types/notification.type';
import {
  getNotificationActors,
  getNotificationPresentation,
} from '../utils/notification-presentation';
import { getNotificationDestination } from '../utils/notification-navigation';
import { NotificationActor } from './notification-actor';
import { NotificationTargetPreview } from './notification-target-preview';

interface NotificationItemProps {
  notification: NotificationListItem;
  isMarkPending: boolean;
  isMarkAllPending: boolean;
  onMarkRead: (notificationId: string) => void;
}

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ thời gian';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const NotificationItem = ({
  notification,
  isMarkPending,
  isMarkAllPending,
  onMarkRead,
}: NotificationItemProps) => {
  const router = useRouter();
  const focusMessage = useConversationDetailsStore((state) => state.focusMessage);
  const presentation = useMemo(
    () => getNotificationPresentation(notification),
    [notification],
  );
  const actors = useMemo(() => getNotificationActors(notification), [notification]);
  const destination = useMemo(
    () => getNotificationDestination(notification),
    [notification],
  );
  const timestamp = formatTimestamp(notification.created_at);
  const primaryText = presentation.actorText
    ? `${presentation.actorText} ${presentation.actionText}`
    : presentation.actionText;
  const canActivate = Boolean(destination) || !notification.is_read;

  const activate = () => {
    if (!notification.is_read) onMarkRead(notification._id);
    if (!destination) return;

    if (destination.kind === 'message') {
      focusMessage(destination.conversationId, destination.messageId);
    }
    router.push(destination.href);
  };

  return (
    <article
      className={`relative overflow-hidden border-b border-[#2F3336] px-4 py-4 transition-colors duration-200 motion-reduce:transition-none ${
        notification.is_read ? 'bg-black hover:bg-white/[0.03]' : 'bg-[#121212] hover:bg-[#181818]'
      }`}
      aria-label={`${primaryText}. ${notification.is_read ? 'Đã đọc' : 'Chưa đọc'}. ${timestamp}`}
    >
      {canActivate && (
        <button
          type="button"
          onClick={activate}
          aria-label={`${primaryText}. ${
            destination ? 'Mở nội dung' : 'Đánh dấu đã đọc'
          }. ${notification.is_read ? 'Đã đọc' : 'Chưa đọc'}`}
          className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
        />
      )}

      <div className="pointer-events-none relative flex gap-3">
        <NotificationActor actors={actors} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={`min-w-0 text-[15px] leading-5 ${
                notification.is_read ? 'text-gray-200' : 'font-medium text-white'
              }`}
            >
              {presentation.actorText && (
                <span className="font-bold">{presentation.actorText} </span>
              )}
              {presentation.actionText}
            </p>
            <time
              dateTime={notification.created_at}
              className="shrink-0 text-xs text-gray-500"
              suppressHydrationWarning
            >
              {timestamp}
            </time>
          </div>

          {!notification.is_read && (
            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#1d9bf0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1d9bf0]" aria-hidden="true" />
              Chưa đọc
            </div>
          )}

          {presentation.showTarget && (
            <NotificationTargetPreview
              target={notification.target_info}
              unavailableText={presentation.unavailableTargetText}
            />
          )}

          {!destination && presentation.showTarget && notification.target_info === null && (
            <p className="mt-2 text-xs text-gray-500">Không có liên kết điều hướng an toàn.</p>
          )}
        </div>
      </div>

      {!notification.is_read && (
        <div className="relative z-10 mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => onMarkRead(notification._id)}
            disabled={isMarkPending || isMarkAllPending}
            className="pointer-events-auto flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-[#1d9bf0] transition-colors hover:bg-[#1d9bf0]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9bf0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isMarkPending ? (
              <LoaderCircle
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            {isMarkPending ? 'Đang cập nhật' : 'Đánh dấu đã đọc'}
          </button>
        </div>
      )}
    </article>
  );
};
