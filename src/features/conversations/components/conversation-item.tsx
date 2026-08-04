'use client';

import React from 'react';
import type { Conversation } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { FriendPresenceDot } from '@/features/users/components/friend-presence-dot';
import { BellOff, Pin } from 'lucide-react';
import { getActiveConversationMute } from '../hooks/use-conversation-actions';
import Link from 'next/link';
import { getSystemPreviewText } from '../utils/system-message-presentation';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isOnline?: boolean;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  isOnline = false,
}) => {
  const currentUserId = useAuthStore((state) => state.user?._id);
  
  // Determine name and avatar based on conversation type
  let title = 'Unknown';
  let avatar = '/default-avatar.png';
  
  if (conversation.type === 'direct') {
    title = conversation.partner_info?.name || 'Unknown User';
    avatar = conversation.partner_info?.avatar || '/default-avatar.png';
  } else if (conversation.type === 'group') {
    title = conversation.name || 'Group Chat';
    avatar = conversation.avatar_url || '/default-group.png';
  }

  const lastMessageDate = conversation.last_message_at
    ? new Date(conversation.last_message_at)
    : null;
  const hasValidLastMessageDate =
    lastMessageDate !== null && Number.isFinite(lastMessageDate.getTime());
  const timeAgo = hasValidLastMessageDate
    ? formatDistanceToNow(lastMessageDate, { addSuffix: false })
    : '';

  const isSentByMe = conversation.last_message_preview?.sender_id === currentUserId;
  const unreadCount = Number.isSafeInteger(conversation.unread_message_count)
    ? Math.max(0, conversation.unread_message_count)
    : 0;
  const isUnread = unreadCount > 0;
  const activeMute = getActiveConversationMute(conversation, currentUserId);
  const isMuted = Boolean(activeMute);
  const [, refreshMuteExpiry] = React.useReducer((version: number) => version + 1, 0);

  React.useEffect(() => {
    if (!activeMute?.until) return;

    const remainingMilliseconds = new Date(activeMute.until).getTime() - Date.now();
    if (remainingMilliseconds <= 0) return;
    const expiryTimer = window.setTimeout(refreshMuteExpiry, remainingMilliseconds + 50);

    return () => window.clearTimeout(expiryTimer);
  }, [activeMute?.until]);
  const messageTypeLabels: Partial<Record<Conversation['last_message_preview']['message_type'], string>> = {
    image: 'Sent an image',
    video: 'Sent a video',
    audio: 'Sent an audio',
    file: 'Sent a file',
  };
  const lastMessageType = conversation.last_message_preview?.message_type;
  const preview = conversation.last_message_preview;
  const lastMessageContent =
    (lastMessageType && messageTypeLabels[lastMessageType]) ||
    (preview ? getSystemPreviewText(preview) : 'Started a conversation');
  let senderPrefix = '';
  if (preview?.kind !== 'system' && conversation.type === 'direct' && isSentByMe) {
    senderPrefix = 'You: ';
  } else if (conversation.type === 'group' && preview?.kind === 'user') {
    senderPrefix = isSentByMe
      ? 'You: '
      : preview.sender_info?.name
        ? `${preview.sender_info.name}: `
        : 'Group member: ';
  }
  const lastMessageText = `${senderPrefix}${lastMessageContent}`;
  const unreadLabel = isUnread
    ? `${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`
    : 'No unread messages';

  return (
    <Link
      href={`/messages/${conversation._id}`}
      aria-current={isActive ? 'page' : undefined}
      aria-label={`${title}, ${unreadLabel}. ${lastMessageText}`}
      className={`flex min-h-20 items-center gap-3 border-b border-[#2f3336] p-4 transition duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white motion-reduce:transition-none
        ${isActive ? 'bg-[#181818]' : 'hover:bg-[#121212]'}`}
    >
      <div className="relative shrink-0">
        <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-600">
          {/* Replace with next/image later if avatar is available */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        </div>
        <FriendPresenceDot isOnline={conversation.type === 'direct' && isOnline} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className={`${isUnread ? 'font-bold' : 'font-semibold'} truncate text-[15px] text-white`}>
            {title}
          </h3>
          {timeAgo && (
            <time
              dateTime={conversation.last_message_at}
              className={`${isUnread ? 'text-[#1d9bf0]' : 'text-gray-500'} ml-2 flex-shrink-0 text-[13px]`}
            >
              {timeAgo}
            </time>
          )}
        </div>
        
        <p className={`${isUnread ? 'font-medium text-white' : 'text-gray-500'} truncate text-[14px]`}>
          {lastMessageText}
        </p>
      </div>
      
      {(isMuted || conversation.is_pinned || isUnread) && (
        <div className="flex shrink-0 items-center gap-1.5">
          {isMuted && (
            <BellOff
              role="img"
              aria-label="Notifications muted"
              className="h-3.5 w-3.5 shrink-0 text-gray-500"
            />
          )}
          {conversation.is_pinned && (
            <Pin
              role="img"
              aria-label="Pinned conversation"
              className="h-3.5 w-3.5 shrink-0 text-gray-500"
            />
          )}
          {isUnread && (
            <span
              aria-hidden="true"
              className="flex min-w-5 items-center justify-center rounded-full bg-[#1d9bf0] px-1.5 py-0.5 text-[11px] font-bold leading-4 text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      )}
    </Link>
  );
};
