import { notifyManager, type QueryClient } from '@tanstack/react-query';
import type { Conversation } from '../types';
import type {
  ConversationReadStateEvent,
  ConversationUnreadSummary,
} from '../types/conversation-unread.type';
import {
  CONVERSATIONS_QUERY_KEY,
  MESSAGES_QUERY_KEY,
  conversationKeys,
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

export const applyConversationReadState = (
  queryClient: QueryClient,
  event: ConversationReadStateEvent,
) => {
  const currentSummary = queryClient.getQueryData<ConversationUnreadSummary>(
    conversationKeys.unreadSummary(),
  );
  if (currentSummary && event.version < currentSummary.version) {
    void queryClient.invalidateQueries({
      queryKey: CONVERSATIONS_QUERY_KEY,
      exact: true,
      refetchType: 'active',
    });
    return true;
  }

  const wasSummaryFetching =
    queryClient.isFetching({
      queryKey: conversationKeys.unreadSummary(),
      exact: true,
    }) > 0;
  const wasConversationListFetching =
    queryClient.isFetching({ queryKey: CONVERSATIONS_QUERY_KEY, exact: true }) > 0;

  void queryClient.cancelQueries(
    { queryKey: conversationKeys.unreadSummary(), exact: true },
    { revert: false },
  );
  void queryClient.cancelQueries(
    { queryKey: CONVERSATIONS_QUERY_KEY, exact: true },
    { revert: false },
  );

  if (!currentSummary) return false;

  notifyManager.batch(() => {
    queryClient.setQueryData<ConversationUnreadSummary>(
      conversationKeys.unreadSummary(),
      (summary) => {
        if (!summary || event.version < summary.version) return summary;
        if (
          event.version === summary.version &&
          event.unread_conversation_count === summary.unread_conversation_count &&
          event.total_unread_message_count === summary.total_unread_message_count &&
          event.updated_at === summary.updated_at
        ) {
          return summary;
        }
        return {
          unread_conversation_count: event.unread_conversation_count,
          total_unread_message_count: event.total_unread_message_count,
          version: event.version,
          updated_at: event.updated_at,
        };
      },
    );

    queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (conversations) => {
      if (!conversations) return conversations;
      let changed = false;
      const nextConversations = conversations.map((conversation) => {
        if (conversation._id !== event.conversation_id) return conversation;
        if (
          conversation.unread_message_count === event.unread_message_count &&
          conversation.last_read_message_id === event.last_read_message_id &&
          conversation.last_read_at === event.last_read_at
        ) {
          return conversation;
        }
        changed = true;
        return {
          ...conversation,
          unread_message_count: event.unread_message_count,
          last_read_message_id: event.last_read_message_id,
          last_read_at: event.last_read_at,
        };
      });
      return changed ? nextConversations : conversations;
    });
  });

  if (wasSummaryFetching) {
    void queryClient.invalidateQueries({
      queryKey: conversationKeys.unreadSummary(),
      exact: true,
      refetchType: 'active',
    });
  }
  if (wasConversationListFetching) {
    void queryClient.invalidateQueries({
      queryKey: CONVERSATIONS_QUERY_KEY,
      exact: true,
      refetchType: 'active',
    });
  }

  return true;
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
