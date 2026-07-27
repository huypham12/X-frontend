'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocket } from '@/providers/socket-provider';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { userService } from '../api/user.service';
import type { Friend, FriendPresenceEvent, FriendPresenceStatus } from '../types/user.type';

interface FriendPresenceContextValue {
  friends: Friend[];
  isLoading: boolean;
  isFriend: (userId?: string) => boolean;
  isOnlineFriend: (userId?: string) => boolean;
}

export const FriendPresenceContext = createContext<FriendPresenceContextValue | null>(null);

export const FRIENDS_QUERY_KEY = ['friends'] as const;

export function FriendPresenceProvider({ children }: { children: React.ReactNode }) {
  const currentUserId = useAuthStore((state) => state.user?._id);
  const { socket, isConnected } = useSocket();
  const [presence, setPresence] = useState<Record<string, boolean>>({});

  const { data: friends = [], isLoading } = useQuery({
    queryKey: FRIENDS_QUERY_KEY,
    queryFn: userService.getFriends,
    enabled: Boolean(currentUserId),
  });

  const friendIds = useMemo(() => friends.map((friend) => friend._id), [friends]);
  const friendIdSet = useMemo(() => new Set(friendIds), [friendIds]);

  useEffect(() => {
    if (!socket || !isConnected || friendIds.length === 0) return;

    let isActive = true;

    socket.emit('get:presence', friendIds, (presenceList: FriendPresenceStatus[]) => {
      if (!isActive) return;

      const nextPresence: Record<string, boolean> = {};
      presenceList.forEach((status) => {
        if (friendIdSet.has(status.user_id)) {
          nextPresence[status.user_id] = status.isOnline;
        }
      });
      setPresence(nextPresence);
    });

    const handleOnline = ({ user_id }: FriendPresenceEvent) => {
      if (!friendIdSet.has(user_id)) return;
      setPresence((current) => ({ ...current, [user_id]: true }));
    };

    const handleOffline = ({ user_id }: FriendPresenceEvent) => {
      if (!friendIdSet.has(user_id)) return;
      setPresence((current) => ({ ...current, [user_id]: false }));
    };

    socket.on('user:online', handleOnline);
    socket.on('user:offline', handleOffline);

    return () => {
      isActive = false;
      socket.off('user:online', handleOnline);
      socket.off('user:offline', handleOffline);
    };
  }, [socket, isConnected, friendIds, friendIdSet]);

  const isFriend = useCallback(
    (userId?: string) => Boolean(userId && friendIdSet.has(userId)),
    [friendIdSet]
  );

  const isOnlineFriend = useCallback(
    (userId?: string) => Boolean(userId && isConnected && friendIdSet.has(userId) && presence[userId]),
    [friendIdSet, isConnected, presence]
  );

  const value = useMemo(
    () => ({ friends, isLoading, isFriend, isOnlineFriend }),
    [friends, isLoading, isFriend, isOnlineFriend]
  );

  return (
    <FriendPresenceContext.Provider value={value}>
      {children}
    </FriendPresenceContext.Provider>
  );
}
