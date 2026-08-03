export const conversationKeys = {
  all: ['conversations'] as const,
  list: () => conversationKeys.all,
  unreadSummary: () => [...conversationKeys.all, 'unread-summary'] as const,
  messageLists: () => ['messages'] as const,
  messages: (conversationId: string) => [...conversationKeys.messageLists(), conversationId] as const,
};

export const CONVERSATIONS_QUERY_KEY = conversationKeys.list();

export const MESSAGES_QUERY_KEY = (conversationId: string) =>
  conversationKeys.messages(conversationId);
