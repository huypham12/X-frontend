'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/features/users/api/user.service';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useCreateConversation } from '../hooks/use-create-conversation';

export const FollowingListForChat = ({ searchQuery }: { searchQuery?: string }) => {
  const { user } = useAuthStore();
  const { mutate: createConversation, isPending } = useCreateConversation();

  const { data: followingData, isLoading } = useQuery({
    queryKey: ['following', user?._id],
    queryFn: () => userService.getFollowing(user?._id as string),
    enabled: !!user?._id,
  });

  const following = followingData?.following;

  const filteredFollowing = React.useMemo(() => {
    if (!following) return [];
    if (!searchQuery) return following;
    const lowerQuery = searchQuery.toLowerCase();
    return following.filter((u: any) => 
      u.name.toLowerCase().includes(lowerQuery) || 
      u.username.toLowerCase().includes(lowerQuery)
    );
  }, [following, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 opacity-50 mt-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 items-center animate-pulse">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 bg-gray-800 rounded w-1/2 mb-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!filteredFollowing || filteredFollowing.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        {searchQuery ? 'No users found matching your search.' : 'You are not following anyone yet.'}
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="px-4 py-2 text-sm font-bold text-gray-400">
        Start a conversation
      </div>
      {filteredFollowing.map((u: any) => (
        <div 
          key={u._id} 
          onClick={() => !isPending && createConversation(u._id)}
          className="flex items-center gap-3 p-4 cursor-pointer transition hover:bg-[#121212] opacity-80 hover:opacity-100"
        >
          <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={u.avatar || '/default-avatar.png'} 
              alt={u.name} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate text-[15px]">{u.name}</h3>
            <p className="text-gray-500 text-[14px] truncate">@{u.username}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
