'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConversationDetailsStore } from '@/features/conversations/stores/conversation-details.store';
import { useMessageComposerStore } from '@/features/conversations/stores/message-composer.store';
import { clearAllConversationReopenedMarkers } from '@/features/conversations/utils/conversation-reopen-state';

const createPersonalQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

export function PersonalSessionBoundary({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createPersonalQueryClient);

  useEffect(() => {
    return () => {
      void queryClient.cancelQueries();
      queryClient.clear();
      useConversationDetailsStore.getState().reset();
      useMessageComposerStore.getState().reset();
      clearAllConversationReopenedMarkers();
    };
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
