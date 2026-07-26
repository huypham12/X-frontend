'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { CreateTweet } from './create-tweet';
import type { Tweet } from '../types/tweet.type';

interface ReplyModalProps {
  tweet: Tweet;
  isOpen: boolean;
  onClose: () => void;
}

const formatTweetAge = (createdAt?: string) => {
  if (!createdAt) return '';

  try {
    return formatDistanceToNowStrict(new Date(createdAt))
      .replace(' seconds', 's')
      .replace(' minutes', 'm')
      .replace(' hours', 'h')
      .replace(' days', 'd');
  } catch {
    return '';
  }
};

export function ReplyModal({ tweet, isOpen, onClose }: ReplyModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const timeAgo = formatTweetAge(tweet.created_at);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reply-modal-title"
      className="fixed inset-0 z-[100] flex items-start justify-center bg-white/10 pt-14 dark:bg-[#242d34]/40 sm:pt-20"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] min-h-[250px] w-full max-w-[600px] flex-col overflow-y-auto bg-black shadow-[0_0_15px_rgba(255,255,255,0.2)] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center bg-black/80 px-4 py-2 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reply composer"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 id="reply-modal-title" className="sr-only">Reply to post</h2>
        </div>

        <div className="px-4 pb-2">
          <div className="relative flex gap-3 pb-4">
            <div className="flex w-10 flex-col items-center">
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[#333639]">
                {tweet.author?.avatar ? (
                  <img
                    src={tweet.author.avatar}
                    alt={tweet.author.name ?? ''}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full" />
                )}
              </div>
              <div className="mt-2 w-0.5 flex-1 bg-[#333639]" />
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center gap-1 text-sm">
                <span className="cursor-pointer font-bold hover:underline">
                  {tweet.author?.name || 'Unknown'}
                </span>
                <span className="text-gray-500">@{tweet.author?.username || 'unknown'}</span>
                {timeAgo && (
                  <>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-500">{timeAgo}</span>
                  </>
                )}
              </div>
              <div className="mt-1 whitespace-pre-wrap text-[15px]">
                {(tweet.content ?? '').split(/(#[a-zA-Z0-9_]+)/g).map((part, index) =>
                  part.startsWith('#') ? (
                    <span key={`${part}-${index}`} className="text-[#1d9bf0] hover:underline">
                      {part}
                    </span>
                  ) : (
                    <span key={`${part}-${index}`}>{part}</span>
                  )
                )}
              </div>
              <div className="mt-3 text-sm text-gray-500">
                Replying to <span className="text-[#1d9bf0]">@{tweet.author?.username}</span>
              </div>
            </div>
          </div>
        </div>

        <CreateTweet
          parentId={tweet._id}
          placeholder="Post your reply"
          submitLabel="Reply"
          variant="modal"
          autoFocus
          onSuccess={onClose}
        />
      </div>
    </div>,
    document.body
  );
}
