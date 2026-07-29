'use client';

import { UsersRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FriendPresenceDot } from '@/features/users/components/friend-presence-dot';
import { useFriendPresence } from '@/features/users/hooks/use-friend-presence';
import { useCreateConversation } from '../hooks/use-create-conversation';
import { useInboxConversationSearch } from '../hooks/use-inbox-conversation-search';
import { useReopenConversation } from '../hooks/use-reopen-conversation';

interface ConversationSearchResultsProps {
  keyword: string;
  onConversationOpened: () => void;
}

const SearchSectionSkeleton = () => (
  <div className="space-y-3 px-4 py-3" aria-label="Loading search results">
    {[1, 2].map((item) => (
      <div key={item} className="flex animate-pulse items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-[#181818]" />
        <div className="h-3 w-1/2 rounded bg-[#181818]" />
      </div>
    ))}
  </div>
);

export const ConversationSearchResults = ({
  keyword,
  onConversationOpened,
}: ConversationSearchResultsProps) => {
  const {
    people,
    groups,
    debouncedKeyword,
    isDebouncing,
    isPeopleLoading,
    isPeopleError,
    retryPeople,
    isGroupsLoading,
    isGroupsError,
    retryGroups,
    hasNextGroupsPage,
    isFetchingNextGroupsPage,
    fetchNextGroupsPage,
  } = useInboxConversationSearch(keyword);
  const createConversation = useCreateConversation();
  const reopenConversation = useReopenConversation();
  const router = useRouter();
  const { isOnlineFriend } = useFriendPresence();
  const hasKeyword = keyword.trim().length > 0;
  const isOpening = createConversation.isPending || reopenConversation.isPending;

  const openPersonConversation = async (personId: string) => {
    try {
      const result = await createConversation.mutateAsync(personId);
      router.push(`/messages/${result.conversation._id}`);
      onConversationOpened();
    } catch {
      // The mutation hook presents the API error to the user.
    }
  };

  const openGroupConversation = async (conversationId: string) => {
    try {
      const result = await reopenConversation.mutateAsync(conversationId);
      router.push(`/messages/${result.conversation._id}`);
      onConversationOpened();
    } catch {
      // The mutation hook presents the API error to the user.
    }
  };

  return (
    <div className="pb-4">
      <section aria-labelledby="people-search-heading">
        <h3 id="people-search-heading" className="px-4 py-2 text-sm font-bold text-gray-400">
          {hasKeyword ? 'People' : 'People you follow'}
        </h3>
        {isPeopleLoading ? (
          <SearchSectionSkeleton />
        ) : isPeopleError ? (
          <button
            type="button"
            onClick={() => void retryPeople()}
            className="w-full px-4 py-4 text-left text-sm text-red-400 hover:bg-[#121212] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
          >
            Could not load people. Try again.
          </button>
        ) : people.length > 0 ? (
          people.map((person) => (
            <button
              key={person._id}
              type="button"
              disabled={isOpening}
              onClick={() => void openPersonConversation(person._id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-[#121212] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="relative shrink-0">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={person.avatar || '/default-avatar.png'}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <FriendPresenceDot isOnline={isOnlineFriend(person._id)} />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{person.name}</span>
                <span className="block truncate text-sm text-gray-500">@{person.username}</span>
              </span>
            </button>
          ))
        ) : (
          <p className="px-4 py-3 text-sm text-gray-500">
            {hasKeyword ? 'No followed people match this search.' : 'You are not following anyone yet.'}
          </p>
        )}
      </section>

      {hasKeyword && (
        <section className="mt-2 border-t border-[#2f3336] pt-2" aria-labelledby="group-search-heading">
          <h3 id="group-search-heading" className="px-4 py-2 text-sm font-bold text-gray-400">
            Groups
          </h3>
          {isDebouncing || isGroupsLoading ? (
            <SearchSectionSkeleton />
          ) : isGroupsError ? (
            <button
              type="button"
              onClick={() => void retryGroups()}
              className="w-full px-4 py-4 text-left text-sm text-red-400 hover:bg-[#121212] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
            >
              Could not search groups. Try again.
            </button>
          ) : groups.length > 0 ? (
            <>
              {groups.map((group) => (
                <button
                  key={group._id}
                  type="button"
                  disabled={isOpening}
                  onClick={() => void openGroupConversation(group._id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-[#121212] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#181818]">
                    {group.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={group.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UsersRound className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    )}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-white">{group.name}</span>
                      {group.is_hidden && (
                        <span className="shrink-0 rounded-full bg-[#181818] px-2 py-0.5 text-[11px] font-medium text-gray-400">
                          Hidden
                        </span>
                      )}
                    </span>
                    <span className="block text-sm text-gray-500">
                      {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                    </span>
                  </span>
                </button>
              ))}
              {hasNextGroupsPage && (
                <button
                  type="button"
                  disabled={isFetchingNextGroupsPage}
                  onClick={() => void fetchNextGroupsPage()}
                  className="mx-4 mt-2 min-h-10 w-[calc(100%-2rem)] rounded-full border border-[#536471] px-4 text-sm font-semibold text-white hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isFetchingNextGroupsPage ? 'Loading…' : 'Load more groups'}
                </button>
              )}
            </>
          ) : (
            <p className="px-4 py-3 text-sm text-gray-500">
              No groups match “{debouncedKeyword}”.
            </p>
          )}
        </section>
      )}
    </div>
  );
};
