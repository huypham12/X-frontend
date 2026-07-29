import type { QueryClient } from '@tanstack/react-query';
import type { Conversation } from '../types';
import {
  CONVERSATIONS_QUERY_KEY,
  MESSAGES_QUERY_KEY,
} from '../constants/conversation-query-keys';

export const sortConversations = (conversations: Conversation[]) =>
  [...conversations].sort((first, second) => {
    if (first.is_pinned !== second.is_pinned) return first.is_pinned ? -1 : 1;

    return new Date(second.last_message_at).getTime() - new Date(first.last_message_at).getTime();
  });

export const upsertConversationCache = (
  queryClient: QueryClient,
  conversation: Conversation,
) => {
  queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (conversations) => {
    const currentConversations = conversations ?? [];
    const hasConversation = currentConversations.some((item) => item._id === conversation._id);
    const updatedConversations = hasConversation
      ? currentConversations.map((item) =>
          item._id === conversation._id ? conversation : item,
        )
      : [conversation, ...currentConversations];

    return sortConversations(updatedConversations);
  });
};

export const clearConversationHistoryCaches = (
  queryClient: QueryClient,
  conversationId: string,
) => {
  queryClient.removeQueries({ queryKey: MESSAGES_QUERY_KEY(conversationId), exact: true });
  queryClient.removeQueries({
    queryKey: ['conversation-message-context', conversationId],
  });
  queryClient.removeQueries({
    queryKey: ['conversation-message-search', conversationId],
  });
  queryClient.removeQueries({ queryKey: ['conversation-media', conversationId] });
  queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (conversations) =>
    conversations?.filter((item) => item._id !== conversationId),
  );
};

export const removeConversationCaches = async (
  queryClient: QueryClient,
  conversationId: string,
) => {
  const scopedQueryKeys = [
    ['conversation-members', conversationId],
    MESSAGES_QUERY_KEY(conversationId),
    ['conversation-media', conversationId],
    ['conversation-message-search', conversationId],
    ['conversation-message-context', conversationId],
  ];

  await Promise.all(
    scopedQueryKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })),
  );
  queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (conversations) =>
    conversations?.filter((item) => item._id !== conversationId),
  );
  scopedQueryKeys.forEach((queryKey) => {
    queryClient.removeQueries({ queryKey });
  });
};
