import { useConversationDetailsStore } from '../stores/conversation-details.store';
import { useMessageComposerStore } from '../stores/message-composer.store';

export const clearConversationUiState = (conversationId: string) => {
  const details = useConversationDetailsStore.getState();
  if (
    details.openConversationId === conversationId ||
    details.targetConversationId === conversationId
  ) {
    details.closeDetails();
  }

  const composer = useMessageComposerStore.getState();
  if (composer.conversationId === conversationId) composer.clearReply();
};
