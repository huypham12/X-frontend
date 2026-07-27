'use client';

import { useContext } from 'react';
import { FriendPresenceContext } from '../providers/friend-presence-provider';

export function useFriendPresence() {
  const context = useContext(FriendPresenceContext);

  if (!context) {
    throw new Error('useFriendPresence must be used within FriendPresenceProvider');
  }

  return context;
}
