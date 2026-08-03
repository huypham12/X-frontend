import { create } from 'zustand';
import type { Message, MessageReplyMediaType, MessageReplyPreview } from '../types';

interface MessageComposerState {
  conversationId: string | null;
  replyTo: MessageReplyPreview | null;
  startReply: (conversationId: string, message: Message) => void;
  clearReply: () => void;
  clearReplyToMessage: (messageId: string) => void;
  reset: () => void;
}

const getReplyMediaType = (message: Message): MessageReplyMediaType | undefined => {
  const mediaType = message.medias_info?.[0]?.type;
  return mediaType === 'image' || mediaType === 'video' || mediaType === 'audio'
    ? mediaType
    : undefined;
};

const EMPTY_REPLY_STATE = {
  conversationId: null,
  replyTo: null,
};

export const useMessageComposerStore = create<MessageComposerState>((set) => ({
  ...EMPTY_REPLY_STATE,
  startReply: (conversationId, message) => {
    const mediaType = getReplyMediaType(message);

    set({
      conversationId,
      replyTo: {
        _id: message._id,
        sender_info: message.sender_info,
        content: message.content.trim().slice(0, 140),
        ...(mediaType ? { media_type: mediaType } : {}),
        status: 'sent',
      },
    });
  },
  clearReply: () => set(EMPTY_REPLY_STATE),
  clearReplyToMessage: (messageId) =>
    set((state) => (state.replyTo?._id === messageId ? EMPTY_REPLY_STATE : state)),
  reset: () => set(EMPTY_REPLY_STATE),
}));
