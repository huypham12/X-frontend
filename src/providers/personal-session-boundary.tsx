'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useConversationDetailsStore } from '@/features/conversations/stores/conversation-details.store';
import { useMessageComposerStore } from '@/features/conversations/stores/message-composer.store';
import { clearAllConversationReopenedMarkers } from '@/features/conversations/utils/conversation-reopen-state';

interface SessionSnapshot {
  isAuthenticated: boolean;
  userId: string | null;
}

export function PersonalSessionBoundary() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?._id ?? null);
  const previousSessionRef = useRef<SessionSnapshot>({ isAuthenticated, userId });

  useEffect(() => {
    const previousSession = previousSessionRef.current;
    const sessionEnded = previousSession.isAuthenticated && !isAuthenticated;
    const identityChanged =
      previousSession.isAuthenticated &&
      isAuthenticated &&
      previousSession.userId !== null &&
      userId !== null &&
      previousSession.userId !== userId;

    previousSessionRef.current = { isAuthenticated, userId };
    if (!sessionEnded && !identityChanged) return;

    void queryClient.cancelQueries();
    queryClient.clear();
    useConversationDetailsStore.getState().reset();
    useMessageComposerStore.getState().reset();
    clearAllConversationReopenedMarkers();
  }, [isAuthenticated, queryClient, userId]);

  return null;
}
