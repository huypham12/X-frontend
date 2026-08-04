'use client';

import React from 'react';
import { useConversations } from '../hooks/use-conversations';
import { ConversationItem } from './conversation-item';
import { Search, MessageSquarePlus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { FollowingListForChat } from './following-list';
import { useFriendPresence } from '@/features/users/hooks/use-friend-presence';
import { ConversationSearchResults } from './conversation-search-results';

export const ConversationSidebar = () => {
  const { data: conversations, isLoading, isError, isFetching, refetch } = useConversations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const params = useParams<{ conversationId?: string }>();
  const activeConversationId = params.conversationId;
  const { isOnlineFriend } = useFriendPresence();
  const closeSearch = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
  };
  const handleSidebarBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const nextFocusedElement = event.relatedTarget;
    if (nextFocusedElement instanceof Node && event.currentTarget.contains(nextFocusedElement)) {
      return;
    }

    setIsSearchFocused(false);
  };
  const focusConversationSearch = () => {
    setIsSearchFocused(true);
    searchInputRef.current?.focus();
  };

  return (
    <div
      onBlurCapture={handleSidebarBlur}
      className="flex h-full min-h-0 w-full flex-col bg-black"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#2f3336]">
        <h2 className="text-xl font-bold text-white">Messages</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={focusConversationSearch}
            aria-label="Start a new message"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full transition hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
            title="New message"
          >
            <MessageSquarePlus aria-hidden="true" className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
      
      {/* Search */}
      <div className="p-4">
        <div className="relative group">
          <Search
            aria-hidden="true"
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 group-focus-within:text-white"
          />
          <input 
            ref={searchInputRef}
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Search people and groups"
            aria-label="Search people and groups"
            className="min-h-11 w-full rounded-full border border-transparent bg-[#202327] py-2 pl-12 pr-4 text-white transition focus:border-white focus:bg-black focus:outline-none focus:ring-1 focus:ring-white motion-reduce:transition-none"
          />
        </div>
      </div>

      {/* List */}
      <div
        aria-busy={isFetching || undefined}
        className="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden"
      >
        {isError && conversations ? (
          <div
            role="status"
            className="flex min-h-11 items-center justify-between gap-3 border-b border-[#2f3336] px-4 py-2 text-xs text-[#a1a1aa]"
          >
            <span>Could not refresh the inbox.</span>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="min-h-11 shrink-0 rounded-full px-3 font-semibold text-white hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFetching ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        ) : null}
        {isSearchFocused || searchQuery.trim().length > 0 ? (
          <ConversationSearchResults
            keyword={searchQuery}
            onConversationOpened={closeSearch}
          />
        ) : isLoading ? (
          <div role="status" aria-label="Loading conversations">
            <div aria-hidden="true" className="flex flex-col gap-4 p-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center gap-3 motion-reduce:animate-none"
                >
                  <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gray-800" />
                  <div className="flex-1">
                    <div className="mb-2 h-4 w-1/2 rounded bg-gray-800" />
                    <div className="h-3 w-3/4 rounded bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isError && !conversations ? (
          <div role="alert" className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-sm text-[#f87171]">Failed to load conversations.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="min-h-11 rounded-full border border-[#2f3336] px-5 text-sm font-semibold text-white transition hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
            >
              {isFetching ? 'Retrying…' : 'Try again'}
            </button>
          </div>
        ) : conversations?.length === 0 ? (
          <div className="flex flex-col">
            <div className="p-8 text-center flex flex-col items-center mt-2 border-b border-[#2f3336]">
              <h3 className="text-white font-bold text-[24px] mb-2 leading-tight">Welcome to your inbox!</h3>
              <p className="text-gray-500 mb-4 text-[14px]">Drop a line, share posts and more with private conversations.</p>
            </div>
            <FollowingListForChat />
          </div>
        ) : (
          <nav aria-label="Conversations">
            {conversations?.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                isActive={activeConversationId === conv._id}
                isOnline={conv.type === 'direct' && isOnlineFriend(conv.partner_id)}
              />
            ))}
          </nav>
        )}
      </div>
    </div>
  );
};
