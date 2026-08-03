'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PrimaryNavigationLinks,
  ReconnectStatus,
  type BadgeKind,
  type BadgeViewState,
} from './primary-navigation';
import { Button } from '../ui/button';
import { ProfileMenu } from '@/features/auth/components/profile-menu';
import { selectIsSessionReady, useAuthStore } from '@/features/auth/stores/auth.store';
import { useConversationUnreadSummary } from '@/features/conversations/hooks/use-conversation-unread-summary';
import { useNotificationUnreadCount } from '@/features/notifications/hooks/use-notification-unread-count';
import { CreateTweetModal } from '@/features/tweets/components/create-tweet-modal';
import { useSocket } from '@/providers/socket-provider';

const RECONNECT_INDICATOR_DELAY_MS = 3000;

export function Sidebar() {
  const pathname = usePathname();
  const { isConnected } = useSocket();
  const isSessionReady = useAuthStore(selectIsSessionReady);
  const notificationUnread = useNotificationUnreadCount();
  const conversationUnread = useConversationUnreadSummary();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showReconnectStatus, setShowReconnectStatus] = useState(false);

  useEffect(() => {
    const shouldShowReconnectStatus = isSessionReady && !isConnected;
    const timeoutId = window.setTimeout(
      () => setShowReconnectStatus(shouldShowReconnectStatus),
      shouldShowReconnectStatus ? RECONNECT_INDICATOR_DELAY_MS : 0,
    );
    return () => window.clearTimeout(timeoutId);
  }, [isConnected, isSessionReady]);

  const badges: Record<BadgeKind, BadgeViewState> = {
    notifications: {
      count: notificationUnread.data?.unreadCount,
      isInitialLoading: notificationUnread.data === undefined && notificationUnread.isPending,
      isSyncing: notificationUnread.data !== undefined && notificationUnread.isFetching,
      isUnavailable: notificationUnread.data === undefined && notificationUnread.isError,
      hasCachedError: notificationUnread.data !== undefined && notificationUnread.isError,
    },
    messages: {
      count: conversationUnread.data?.unread_conversation_count,
      isInitialLoading: conversationUnread.data === undefined && conversationUnread.isPending,
      isSyncing: conversationUnread.data !== undefined && conversationUnread.isFetching,
      isUnavailable: conversationUnread.data === undefined && conversationUnread.isError,
      hasCachedError: conversationUnread.data !== undefined && conversationUnread.isError,
    },
  };
  const isInitialBadgeLoading =
    badges.notifications.isInitialLoading || badges.messages.isInitialLoading;

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[275px] shrink-0 flex-col overflow-y-auto border-r border-[#2F3336] p-4 sm:flex">
        <Link
          href="/home"
          aria-label="X home"
          className="mb-2 w-fit rounded-full p-2 transition-colors hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-8 fill-white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </Link>

        <nav
          aria-label="Primary navigation"
          aria-busy={isInitialBadgeLoading || undefined}
          className="mt-2 flex-1 space-y-2 text-xl font-medium"
        >
          <PrimaryNavigationLinks pathname={pathname} mode="desktop" badges={badges} />

          <Button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            aria-haspopup="dialog"
            className="mt-4 h-14 w-[90%] rounded-full bg-[#1d9bf0] text-lg font-bold text-white hover:bg-[#1a8cd8]"
          >
            Post
          </Button>

          {showReconnectStatus ? <ReconnectStatus /> : null}
        </nav>

        <ProfileMenu />
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#2F3336] bg-black pb-[env(safe-area-inset-bottom)] sm:hidden">
        {showReconnectStatus ? <ReconnectStatus mobile /> : null}
        <nav
          aria-label="Primary navigation"
          aria-busy={isInitialBadgeLoading || undefined}
          className="flex h-16 items-stretch justify-around px-2"
        >
          <PrimaryNavigationLinks pathname={pathname} mode="mobile" badges={badges} />
        </nav>
      </div>

      <CreateTweetModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
}
