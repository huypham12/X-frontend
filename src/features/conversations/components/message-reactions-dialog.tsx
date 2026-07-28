'use client';

import { useQuery } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { conversationsApi } from '../api/conversations.api';
import { MESSAGE_REACTION_DETAILS_QUERY_KEY } from '../hooks/use-message-actions';
import type { MessageReactionEmoji } from '../types/message-action.type';

interface MessageReactionsDialogProps {
  messageId: string;
  open: boolean;
  selectedEmoji?: MessageReactionEmoji;
  currentUserId?: string;
  isRemovingCurrentUserReaction?: boolean;
  onRemoveCurrentUserReaction?: () => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
}

const getInitials = (name: string) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return initials || '?';
};

export const MessageReactionsDialog = ({
  messageId,
  open,
  selectedEmoji,
  currentUserId,
  isRemovingCurrentUserReaction = false,
  onRemoveCurrentUserReaction,
  onOpenChange,
}: MessageReactionsDialogProps) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: MESSAGE_REACTION_DETAILS_QUERY_KEY(messageId),
    queryFn: () => conversationsApi.getMessageReactions(messageId),
    enabled: open,
  });
  const filteredReactions = selectedEmoji
    ? data?.filter((reaction) => reaction.emoji === selectedEmoji)
    : data;
  const visibleReactions = filteredReactions
    ? [...filteredReactions].sort((first, second) => {
        const firstIsCurrentUser = first.user._id === currentUserId;
        const secondIsCurrentUser = second.user._id === currentUserId;
        return Number(secondIsCurrentUser) - Number(firstIsCurrentUser);
      })
    : undefined;

  const removeCurrentUserReaction = async () => {
    if (!onRemoveCurrentUserReaction || isRemovingCurrentUserReaction) return;
    const succeeded = await onRemoveCurrentUserReaction();
    if (succeeded) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden border border-[#2f3336] bg-[#121212] p-0 text-white shadow-2xl">
        <DialogHeader className="border-b border-[#2f3336] px-5 py-5 pr-12">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            {selectedEmoji && <span aria-hidden="true">{selectedEmoji}</span>}
            Message reactions
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            People who reacted to this message.
          </DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar max-h-[min(60vh,28rem)] overflow-y-auto px-3 py-3">
          {isLoading ? (
            <div className="space-y-2" aria-label="Loading reactions">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-xl bg-[#181818] motion-reduce:animate-none"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center px-4 py-8 text-center">
              <p className="text-sm text-gray-400">Could not load reactions.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 flex min-h-11 items-center gap-2 rounded-full border border-[#536471] px-4 text-sm font-semibold transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            </div>
          ) : visibleReactions?.length ? (
            <ul>
              {visibleReactions.map(({ emoji, user }) => {
                const isCurrentUser = user._id === currentUserId;
                const rowContent = (
                  <>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2f3336] text-xs font-bold">
                      {getInitials(user.name)}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      {isCurrentUser ? (
                        <p className="truncate text-sm text-gray-400">
                          {isRemovingCurrentUserReaction ? 'Removing…' : 'Click to remove'}
                        </p>
                      ) : (
                        <p className="truncate text-sm text-gray-500">@{user.username}</p>
                      )}
                    </div>
                    <span className="text-xl" aria-label={`Reacted with ${emoji}`}>
                      {emoji}
                    </span>
                  </>
                );

                return (
                  <li key={`${emoji}-${user._id}`}>
                    {isCurrentUser && onRemoveCurrentUserReaction ? (
                      <button
                        type="button"
                        disabled={isRemovingCurrentUserReaction}
                        onClick={() => void removeCurrentUserReaction()}
                        aria-label={`Remove your ${emoji} reaction`}
                        className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-200 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
                      >
                        {rowContent}
                      </button>
                    ) : (
                      <div className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-2">
                        {rowContent}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-gray-400">
              No reactions to show.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
