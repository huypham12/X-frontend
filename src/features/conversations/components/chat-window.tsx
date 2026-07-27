'use client';

import React from 'react';
import { useConversations } from '../hooks/use-conversations';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { Info, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFriendPresence } from '@/features/users/hooks/use-friend-presence';
import { FriendPresenceDot } from '@/features/users/components/friend-presence-dot';

interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
  const router = useRouter();
  const { data: conversations } = useConversations();
  const { isOnlineFriend } = useFriendPresence();
  const conversation = conversations?.find(c => c._id === conversationId);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-twitter-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  let title = 'Unknown';
  let avatar = '/default-avatar.png';
  let profileLink = '#';
  let isPartnerOnline = false;

  if (conversation.type === 'direct') {
    title = conversation.partner_info?.name || 'Unknown User';
    avatar = conversation.partner_info?.avatar || '/default-avatar.png';
    profileLink = conversation.partner_info?.username
      ? `/profile/${encodeURIComponent(conversation.partner_info.username)}`
      : '/profile';
    isPartnerOnline = isOnlineFriend(conversation.partner_id);
  } else if (conversation.type === 'group') {
    title = conversation.name || 'Group Chat';
    avatar = conversation.avatar_url || '/default-group.png';
  }

  return (
    <div className="sticky top-10 flex h-[calc(100dvh-2.5rem)] min-h-0 flex-1 flex-col overflow-hidden bg-black lg:top-0 lg:h-dvh">
      {/* Header */}
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-[#2f3336] bg-black/80 p-4 backdrop-blur-md">
        <Link href={profileLink} className="flex items-center gap-3 hover:opacity-80 transition">
          <div className="relative shrink-0">
            <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar} alt={title} className="h-full w-full object-cover" />
            </div>
            <FriendPresenceDot isOnline={isPartnerOnline} />
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </Link>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-[#181818] rounded-full transition text-white">
            <Info className="w-5 h-5" />
          </button>
          <button 
            onClick={() => router.push('/messages')}
            className="p-2 hover:bg-[#181818] rounded-full transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <MessageList conversationId={conversationId} />
      
      {/* Input */}
      <MessageInput 
        conversationId={conversationId} 
        conversationType={conversation.type} 
      />
    </div>
  );
};
