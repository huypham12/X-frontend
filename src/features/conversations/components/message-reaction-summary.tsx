'use client';

import type { Reaction } from '../types';
import type { MessageReactionEmoji } from '../types/message-action.type';

interface MessageReactionSummaryProps {
  reactions: Reaction[];
  currentUserId?: string;
  onOpen: (emoji?: MessageReactionEmoji) => void;
}

export const getCurrentUserReaction = (
  reactions: Reaction[],
  currentUserId?: string,
): MessageReactionEmoji | undefined => {
  return reactions.find((reaction) => reaction.user_id === currentUserId)?.emoji;
};

export const MessageReactionSummary = ({
  reactions,
  currentUserId,
  onOpen,
}: MessageReactionSummaryProps) => {
  const summaryByEmoji = new Map<
    MessageReactionEmoji,
    { emoji: MessageReactionEmoji; count: number; includesCurrentUser: boolean }
  >();

  reactions.forEach((reaction) => {
    const existing = summaryByEmoji.get(reaction.emoji);
    summaryByEmoji.set(reaction.emoji, {
      emoji: reaction.emoji,
      count: (existing?.count ?? 0) + 1,
      includesCurrentUser:
        Boolean(existing?.includesCurrentUser) || reaction.user_id === currentUserId,
    });
  });
  const summary = [...summaryByEmoji.values()];
  const totalCount = reactions.length;
  const includesCurrentUser = summary.some((item) => item.includesCurrentUser);
  const visibleEmojis = summary.slice(0, 3);

  if (summary.length === 0) return null;

  return (
    <button
      type="button"
      onClick={() => onOpen(summary.length === 1 ? summary[0].emoji : undefined)}
      aria-label={`${totalCount} ${totalCount === 1 ? 'reaction' : 'reactions'}: ${summary
        .map((item) => item.emoji)
        .join(' ')}${includesCurrentUser ? ', including yours' : ''}`}
      className={`absolute -bottom-3 right-1 z-10 flex h-8 min-w-8 items-center justify-center rounded-full border bg-[#181818] px-1.5 text-white shadow-md transition-[background-color,border-color,transform] duration-200 after:absolute after:-inset-1.5 after:content-[''] hover:-translate-y-0.5 hover:bg-[#202020] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        includesCurrentUser ? 'border-[#1d9bf0]' : 'border-[#2f3336]'
      }`}
    >
      <span className="flex -space-x-0.5" aria-hidden="true">
        {visibleEmojis.map(({ emoji }) => (
          <span key={emoji} className="text-[15px] leading-none">
            {emoji}
          </span>
        ))}
      </span>
      {totalCount > 1 && (
        <span className="ml-1 text-[11px] font-semibold leading-none text-gray-300">
          {totalCount}
        </span>
      )}
    </button>
  );
};
