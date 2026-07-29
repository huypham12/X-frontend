const conversationReopenedAtById = new Map<string, number>();

export const markConversationReopened = (conversationId: string, reopenedAt: string) => {
  const timestamp = new Date(reopenedAt).getTime();
  if (Number.isFinite(timestamp)) conversationReopenedAtById.set(conversationId, timestamp);
};

export const wasConversationReopenedAfter = (
  conversationId: string,
  historyClearedAt: string,
) => {
  const reopenedAt = conversationReopenedAtById.get(conversationId);
  const clearedAt = new Date(historyClearedAt).getTime();
  return Boolean(reopenedAt && Number.isFinite(clearedAt) && reopenedAt > clearedAt);
};

export const clearConversationReopenedMarker = (conversationId: string) => {
  conversationReopenedAtById.delete(conversationId);
};
