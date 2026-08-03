import { useQuery } from '@tanstack/react-query';
import { selectIsSessionReady, useAuthStore } from '@/features/auth/stores/auth.store';
import { conversationsApi } from '../api/conversations.api';
import { CONVERSATIONS_QUERY_KEY } from '../constants/conversation-query-keys';

export { CONVERSATIONS_QUERY_KEY } from '../constants/conversation-query-keys';

export const useConversations = () => {
  const isSessionReady = useAuthStore(selectIsSessionReady);

  return useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: () => conversationsApi.getConversations(),
    enabled: isSessionReady,
  });
};
