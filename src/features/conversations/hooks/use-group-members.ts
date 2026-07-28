import { useQuery } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations.api';

export const GROUP_MEMBERS_QUERY_KEY = (conversationId: string) =>
  ['conversation-members', conversationId] as const;

export const useGroupMembers = (conversationId: string) =>
  useQuery({
    queryKey: GROUP_MEMBERS_QUERY_KEY(conversationId),
    queryFn: () => conversationsApi.getGroupMembers(conversationId),
    enabled: Boolean(conversationId),
  });
