import { useQuery } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations.api';

export const CONVERSATIONS_QUERY_KEY = ['conversations'];

export const useConversations = () => {
  return useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: () => conversationsApi.getConversations(),
  });
};
