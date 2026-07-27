'use client';

import React from 'react';
import { useConversations } from '../hooks/use-conversations';
import { ConversationItem } from './conversation-item';
import { Search, MessageSquarePlus } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { FollowingListForChat } from './following-list';
import { useFriendPresence } from '@/features/users/hooks/use-friend-presence';

export const ConversationSidebar = () => {
  const { data: conversations, isLoading, isError } = useConversations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const router = useRouter();
  const params = useParams();
  const activeConversationId = params.conversationId as string;
  const { isOnlineFriend } = useFriendPresence();

  return (
    <div className="w-full sm:w-[350px] h-full flex flex-col bg-black">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#2f3336]">
        <h2 className="text-xl font-bold text-white">Messages</h2>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-[#181818] rounded-full transition" title="New message">
            <MessageSquarePlus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
      
      {/* Search */}
      <div className="p-4">
        <div className="relative group">
          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-white" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => {
              // Delay hiding search results so clicks can register
              setTimeout(() => setIsSearchFocused(false), 200);
            }}
            placeholder="Search Direct Messages" 
            className="w-full bg-[#202327] text-white rounded-full py-2 pl-12 pr-4 focus:outline-none focus:bg-black focus:ring-1 focus:ring-white border border-transparent focus:border-white transition"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {isSearchFocused || searchQuery.trim().length > 0 ? (
          <FollowingListForChat searchQuery={searchQuery} />
        ) : isLoading ? (
          <div className="flex flex-col gap-4 p-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-3 items-center animate-pulse">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-800 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-4 text-center text-red-500 text-sm">Failed to load conversations.</div>
        ) : conversations?.length === 0 ? (
          <div className="flex flex-col">
            <div className="p-8 text-center flex flex-col items-center mt-2 border-b border-[#2f3336]">
              <h3 className="text-white font-bold text-[24px] mb-2 leading-tight">Welcome to your inbox!</h3>
              <p className="text-gray-500 mb-4 text-[14px]">Drop a line, share posts and more with private conversations.</p>
            </div>
            <FollowingListForChat />
          </div>
        ) : (
          conversations?.map((conv) => (
            <ConversationItem 
              key={conv._id} 
              conversation={conv} 
              isActive={activeConversationId === conv._id}
              isOnline={conv.type === 'direct' && isOnlineFriend(conv.partner_id)}
              onClick={(id) => router.push(`/messages/${id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
};
