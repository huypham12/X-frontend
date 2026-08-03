'use client';

import { useQuery } from '@tanstack/react-query';
import { selectIsSessionReady, useAuthStore } from '@/features/auth/stores/auth.store';
import { keepNewestVersionedState } from '@/utils/versioned-state';
import { conversationsApi } from '../api/conversations.api';
import { conversationKeys } from '../constants/conversation-query-keys';

export const useConversationUnreadSummary = () => {
  const isSessionReady = useAuthStore(selectIsSessionReady);

  return useQuery({
    queryKey: conversationKeys.unreadSummary(),
    queryFn: conversationsApi.getUnreadSummary,
    enabled: isSessionReady,
    structuralSharing: keepNewestVersionedState,
  });
};
