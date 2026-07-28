'use client';

import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';
import type { MessageReactionEmoji } from '../types/message-action.type';

const DEFAULT_REACTION_UNIFIED_CODES = [
  '1f44d',
  '2764-fe0f',
  '1f602',
  '1f62e',
  '1f622',
  '1f621',
];

interface MessageReactionPickerProps {
  isPending?: boolean;
  onSelect: (emoji: MessageReactionEmoji) => void;
  onEscape: () => void;
}

export const MessageReactionPicker = ({
  isPending = false,
  onSelect,
  onEscape,
}: MessageReactionPickerProps) => {
  const selectEmoji = (emojiData: EmojiClickData) => {
    if (!isPending) onSelect(emojiData.emoji);
  };

  return (
    <div
      onKeyDownCapture={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        onEscape();
      }}
      aria-label="Choose a message reaction"
    >
      <EmojiPicker
        reactionsDefaultOpen
        reactions={DEFAULT_REACTION_UNIFIED_CODES}
        allowExpandReactions
        onReactionClick={selectEmoji}
        onEmojiClick={selectEmoji}
        theme={Theme.DARK}
        lazyLoadEmojis
        autoFocusSearch={false}
        width="min(350px, calc(100vw - 16px))"
        height="min(420px, calc(100dvh - 32px))"
        previewConfig={{ showPreview: false }}
      />
    </div>
  );
};
