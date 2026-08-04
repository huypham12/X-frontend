'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/features/users/api/user.service';
import {
  captureAuthSession,
  isAuthSessionCurrent,
  useAuthStore,
} from '@/features/auth/stores/auth.store';
import { useCreateConversation } from '../hooks/use-create-conversation';
import { useFriendPresence } from '@/features/users/hooks/use-friend-presence';
import { FriendPresenceDot } from '@/features/users/components/friend-presence-dot';

export const FollowingListForChat = ({ searchQuery }: { searchQuery?: string }) => {
  const { user } = useAuthStore();
  const createConversation = useCreateConversation();
  const router = useRouter();
  const { isOnlineFriend } = useFriendPresence();
  const currentUserId = user?._id;

  const {
    data: followingData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['following', currentUserId],
    queryFn: () => {
      if (!currentUserId) throw new Error('Authenticated user is unavailable');
      return userService.getFollowing(currentUserId);
    },
    enabled: Boolean(currentUserId),
  });

  const following = followingData?.following;

  const filteredFollowing = React.useMemo(() => {
    if (!following) return [];
    if (!searchQuery) return following;
    const lowerQuery = searchQuery.toLowerCase();
    return following.filter((u) =>
      u.name.toLowerCase().includes(lowerQuery) ||
      u.username.toLowerCase().includes(lowerQuery)
    );
  }, [following, searchQuery]);

  if (isLoading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading people you follow"
        className="mt-4 flex flex-col gap-4 p-4 opacity-50"
      >
        <div aria-hidden="true" className="contents">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex animate-pulse items-center gap-3 motion-reduce:animate-none"
            >
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-800" />
              <div className="flex-1">
                <div className="mb-2 h-3 w-1/2 rounded bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError && !followingData) {
    return (
      <div role="alert" className="flex flex-col items-center px-6 py-8 text-center">
        <p className="text-sm text-gray-400">Could not load people you follow.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="mt-4 min-h-11 rounded-full border border-[#536471] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        >
          {isFetching ? 'Retrying…' : 'Try again'}
        </button>
      </div>
    );
  }

  const refreshErrorStatus = isError ? (
    <div
      role="status"
      className="flex min-h-11 items-center justify-between gap-3 border-b border-[#2f3336] px-4 py-2 text-xs text-gray-300"
    >
      <span>Could not refresh people you follow.</span>
      <button
        type="button"
        onClick={() => void refetch()}
        disabled={isFetching}
        className="min-h-11 shrink-0 rounded-full px-3 font-semibold text-white hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isFetching ? 'Retrying…' : 'Retry'}
      </button>
    </div>
  ) : null;

  if (!filteredFollowing || filteredFollowing.length === 0) {
    return (
      <div>
        {refreshErrorStatus}
        <p className="p-8 text-center text-sm text-gray-500">
          {searchQuery
            ? 'No users found matching your search.'
            : 'You are not following anyone yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      {refreshErrorStatus}
      <div className="px-4 py-2 text-sm font-bold text-gray-400">
        Start a conversation
      </div>
      {filteredFollowing.map((u) => (
        <button
          key={u._id}
          type="button"
          disabled={createConversation.isPending}
          onClick={() => {
            const session = captureAuthSession();
            void createConversation.mutateAsync(u._id)
              .then((result) => {
                if (isAuthSessionCurrent(session)) {
                  router.push(`/messages/${result.conversation._id}`);
                }
              })
              .catch(() => undefined);
          }}
          className="flex min-h-11 w-full items-center gap-3 p-4 text-left opacity-80 transition hover:bg-[#121212] hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
        >
          <div className="relative shrink-0">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u.avatar || '/default-avatar.png'}
                alt={u.name}
                className="h-full w-full object-cover"
              />
            </div>
            <FriendPresenceDot isOnline={isOnlineFriend(u._id)} />
          </div>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-white">{u.name}</span>
            <span className="block truncate text-[14px] text-gray-500">@{u.username}</span>
          </span>
        </button>
      ))}
    </div>
  );
};
