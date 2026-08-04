'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import type { Conversation } from '../types';
import { conversationKeys } from '../constants/conversation-query-keys';
import { removeConversationCaches } from '../utils/conversation-cache';
import { clearConversationUiState } from '../utils/conversation-ui-state';

interface ActiveGroupMembershipReconciliationOptions {
  conversationId: string;
  conversation: Conversation | undefined;
  isConversationListResolved: boolean;
}

export const useActiveGroupMembershipReconciliation = ({
  conversationId,
  conversation,
  isConversationListResolved,
}: ActiveGroupMembershipReconciliationOptions) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const lastKnownGroupIdRef = useRef<string | null>(null);
  const cleanupStartedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (conversation?.type === 'group') {
      lastKnownGroupIdRef.current = conversationId;
      cleanupStartedForRef.current = null;
      return;
    }

    if (lastKnownGroupIdRef.current !== conversationId) {
      lastKnownGroupIdRef.current = null;
      cleanupStartedForRef.current = null;
      return;
    }

    if (
      !isConversationListResolved ||
      conversation ||
      cleanupStartedForRef.current === conversationId
    ) {
      return;
    }

    cleanupStartedForRef.current = conversationId;
    clearConversationUiState(conversationId);
    router.replace('/messages');
    void removeConversationCaches(queryClient, conversationId).then(() =>
      queryClient.invalidateQueries({
        queryKey: conversationKeys.unreadSummary(),
        refetchType: 'active',
      }),
    );
  }, [
    conversation,
    conversationId,
    isConversationListResolved,
    queryClient,
    router,
  ]);
};
