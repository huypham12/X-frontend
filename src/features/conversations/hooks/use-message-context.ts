import { useQuery } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations.api';

export const MESSAGE_CONTEXT_QUERY_KEY = (conversationId: string, messageId: string) => [
  'conversation-message-context',
  conversationId,
  messageId,
];

export const useMessageContext = (conversationId: string, messageId: string | null) =>
  useQuery({
    queryKey: MESSAGE_CONTEXT_QUERY_KEY(conversationId, messageId || 'none'),
    queryFn: () => conversationsApi.getMessageContext(conversationId, messageId as string),
    enabled: Boolean(messageId),
  });
