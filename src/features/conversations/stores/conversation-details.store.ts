import { create } from 'zustand';
import type { ConversationPanelView } from '../types/conversation-panel.type';

interface ConversationDetailsState {
  openConversationId: string | null;
  view: ConversationPanelView;
  targetMessageId: string | null;
  toggleDetails: (conversationId: string) => void;
  closeDetails: () => void;
  openView: (view: ConversationPanelView) => void;
  focusMessage: (messageId: string) => void;
  clearFocusedMessage: () => void;
}

const CLOSED_DETAILS_STATE = {
  openConversationId: null,
  view: 'overview' as const,
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
        targetMessageId: null,
      };
    }),
  closeDetails: () => set(CLOSED_DETAILS_STATE),
  openView: (view) =>
    set((state) => (state.openConversationId ? { view } : state)),
  focusMessage: (messageId) => set({ targetMessageId: messageId }),
  clearFocusedMessage: () => set({ targetMessageId: null }),
}));
