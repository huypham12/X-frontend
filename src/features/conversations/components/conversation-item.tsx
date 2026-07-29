'use client';

import React from 'react';
import type { Conversation } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { FriendPresenceDot } from '@/features/users/components/friend-presence-dot';
import { BellOff, Pin } from 'lucide-react';
import { getActiveConversationMute } from '../hooks/use-conversation-actions';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isOnline?: boolean;
  onClick: (conversationId: string) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  isOnline = false,
  onClick,
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

  const timeAgo = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: false })
    : '';

  const isSentByMe = conversation.last_message_preview?.sender_id === currentUserId;
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
  const lastMessageText =
    (lastMessageType && messageTypeLabels[lastMessageType]) ||
    conversation.last_message_preview?.content ||
    'Started a conversation';

  return (
    <div
      onClick={() => onClick(conversation._id)}
      className={`flex items-center gap-3 p-4 cursor-pointer transition duration-200 ease-in-out border-b border-[#2f3336]
        ${isActive ? 'bg-[#181818]' : 'hover:bg-[#121212]'}`}
    >
      <div className="relative shrink-0">
        <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-600">
          {/* Replace with next/image later if avatar is available */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt={title} className="h-full w-full object-cover" />
        </div>
        <FriendPresenceDot isOnline={conversation.type === 'direct' && isOnline} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-semibold text-white truncate text-[15px]">{title}</h3>
          {timeAgo && (
            <span className="text-gray-500 text-[13px] ml-2 flex-shrink-0">
              {timeAgo}
            </span>
          )}
        </div>
        
        <p className="text-gray-500 text-[14px] truncate">
          {isSentByMe ? `You: ${lastMessageText}` : lastMessageText}
        </p>
      </div>
      
      {(isMuted || conversation.is_pinned) && (
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
        </div>
      )}
    </div>
  );
};
