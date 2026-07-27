'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { LoaderCircle, Search, SearchX } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useMessageSearch } from '../hooks/use-message-search';
import { useConversationDetailsStore } from '../stores/conversation-details.store';
import type { Conversation, Message } from '../types';

interface ConversationSearchViewProps {
  conversation: Conversation;
}

const getSenderLabel = (
  message: Message,
  conversation: Conversation,
  currentUserId: string | undefined,
) => {
  if (message.sender_id === currentUserId) return 'You';

  if (conversation.type === 'direct') {
    return conversation.partner_info?.name || 'Conversation partner';
  }

  return (
    conversation.members.find((member) => member.user_id === message.sender_id)?.user?.name ||
    'Group member'
  );
};

const getMessageSnippet = (message: Message) => {
  const content = message.content.trim();
  if (content) return content;
  if (message.media_ids.length > 0) return 'Media message';
  return 'Message';
};

export const ConversationSearchView = ({ conversation }: ConversationSearchViewProps) => {
  const [keyword, setKeyword] = useState('');
  const currentUserId = useAuthStore((state) => state.user?._id);
  const focusMessage = useConversationDetailsStore((state) => state.focusMessage);
  const {
    data,
    debouncedKeyword,
    isDebouncing,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessageSearch(conversation._id, keyword);

  const messages = useMemo(() => {
    const uniqueMessages = new Map<string, Message>();
    data?.pages.forEach((page) => {
      page.messages.forEach((message) => uniqueMessages.set(message._id, message));
    });
    return [...uniqueMessages.values()];
  }, [data]);

  const hasKeyword = debouncedKeyword.length > 0;

  return (
    <div className="flex min-h-full flex-col px-4 py-5">
      <label htmlFor={`conversation-search-${conversation._id}`} className="sr-only">
        Search messages
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
          aria-hidden="true"
        />
        <input
          id={`conversation-search-${conversation._id}`}
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Search messages"
          autoComplete="off"
          className="h-11 w-full rounded-full border border-transparent bg-[#181818] pl-11 pr-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#536471] focus:ring-2 focus:ring-white"
        />
      </div>

      <div aria-live="polite" className="mt-5 min-h-0 flex-1">
        {!keyword.trim() ? (
          <div className="flex flex-col items-center px-4 py-14 text-center text-gray-500">
            <Search className="mb-3 h-7 w-7" aria-hidden="true" />
            <p className="text-sm">Enter a word or phrase to search this conversation.</p>
          </div>
        ) : isDebouncing || isLoading ? (
          <div className="space-y-3" aria-label="Searching messages">
            {[0, 1, 2].map((item) => (
              <div key={item} className="animate-pulse rounded-xl bg-[#121212] p-4">
                <div className="h-3 w-24 rounded bg-[#2f3336]" />
                <div className="mt-3 h-4 w-full rounded bg-[#2f3336]" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center px-4 py-12 text-center">
            <p className="text-sm text-gray-400">Could not search messages.</p>
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="mt-4 rounded-full border border-[#536471] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Retry
            </button>
          </div>
        ) : hasKeyword && messages.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-14 text-center text-gray-500">
            <SearchX className="mb-3 h-7 w-7" aria-hidden="true" />
            <p className="text-sm">No messages found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <article key={message._id} className="rounded-xl bg-[#121212] p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
                  <span className="truncate font-semibold text-gray-300">
                    {getSenderLabel(message, conversation, currentUserId)}
                  </span>
                  <time dateTime={message.send_at} className="shrink-0">
                    {format(new Date(message.send_at), 'MMM d, yyyy · h:mm a')}
                  </time>
                </div>
                <p className="mt-2 line-clamp-3 break-words text-sm leading-5 text-white">
                  {getMessageSnippet(message)}
                </p>
                <button
                  type="button"
                  onClick={() => focusMessage(conversation._id, message._id)}
                  className="mt-3 rounded-full border border-[#536471] px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  View in conversation
                </button>
              </article>
            ))}

            {hasNextPage && (
              <button
                type="button"
                onClick={() => {
                  void fetchNextPage();
                }}
                disabled={isFetchingNextPage}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#536471] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isFetchingNextPage && (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {isFetchingNextPage ? 'Loading' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
