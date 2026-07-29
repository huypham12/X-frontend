import { useInfiniteQuery } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations.api';
import { MESSAGES_QUERY_KEY } from '../constants/conversation-query-keys';

export { MESSAGES_QUERY_KEY } from '../constants/conversation-query-keys';

export const useMessages = (conversationId: string) => {
  return useInfiniteQuery({
    queryKey: MESSAGES_QUERY_KEY(conversationId),
    queryFn: ({ pageParam }) => conversationsApi.getMessages(conversationId, 20, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
  });
};
