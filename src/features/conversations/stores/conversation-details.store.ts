import { create } from 'zustand';
import type { ConversationPanelView } from '../types/conversation-panel.type';

interface ConversationDetailsState {
  openConversationId: string | null;
  view: ConversationPanelView;
  targetConversationId: string | null;
  targetMessageId: string | null;
  toggleDetails: (conversationId: string) => void;
  closeDetails: () => void;
  openView: (view: ConversationPanelView) => void;
  focusMessage: (conversationId: string, messageId: string) => void;
  clearFocusedMessage: () => void;
  reset: () => void;
}

const CLOSED_DETAILS_STATE = {
  openConversationId: null,
  view: 'overview' as const,
  targetConversationId: null,
  targetMessageId: null,
};

export const useConversationDetailsStore = create<ConversationDetailsState>((set) => ({
  ...CLOSED_DETAILS_STATE,
  toggleDetails: (conversationId) =>
    set((state) => {
      if (state.openConversationId === conversationId) {
        return CLOSED_DETAILS_STATE;
      }

      return {
        openConversationId: conversationId,
        view: 'overview',
        targetConversationId: null,
        targetMessageId: null,
      };
    }),
  closeDetails: () => set(CLOSED_DETAILS_STATE),
  openView: (view) =>
    set((state) => (state.openConversationId ? { view } : state)),
  focusMessage: (conversationId, messageId) =>
    set({
      openConversationId: null,
      view: 'overview',
      targetConversationId: conversationId,
      targetMessageId: messageId,
    }),
  clearFocusedMessage: () => set({ targetConversationId: null, targetMessageId: null }),
  reset: () => set(CLOSED_DETAILS_STATE),
}));
