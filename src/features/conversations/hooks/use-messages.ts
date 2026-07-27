import { useInfiniteQuery } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations.api';

export const MESSAGES_QUERY_KEY = (conversationId: string) => ['messages', conversationId];

export const useMessages = (conversationId: string) => {
  return useInfiniteQuery({
    queryKey: MESSAGES_QUERY_KEY(conversationId),
    queryFn: ({ pageParam }) => conversationsApi.getMessages(conversationId, 20, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
  });
};
