import { useQuery } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations.api';
import { CONVERSATIONS_QUERY_KEY } from '../constants/conversation-query-keys';

export { CONVERSATIONS_QUERY_KEY } from '../constants/conversation-query-keys';

export const useConversations = () => {
  return useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: () => conversationsApi.getConversations(),
  });
};
