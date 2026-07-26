'use client';

import { Loader2 } from 'lucide-react';
import { TweetCard } from './tweet-card';
import type { Tweet } from '../types/tweet.type';

interface ConversationThreadProps {
  rootTweet: Tweet;
  replies: Tweet[];
  repliesStatus: 'pending' | 'error' | 'success';
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadMoreRef: (node?: Element | null) => void;
}

export function ConversationThread({
  rootTweet,
  replies,
  repliesStatus,
  hasNextPage,
  isFetchingNextPage,
  loadMoreRef,
}: ConversationThreadProps) {
  const directReplies = replies.filter(
    (reply) => reply.type === undefined || reply.type === 2
  );

  return (
    <section aria-label="Conversation thread" className="border-b border-[#2F3336]">
      <div className="relative">
        {(repliesStatus === 'pending' || directReplies.length > 0 || hasNextPage) && (
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-9 top-12 w-px bg-[#333639]"
          />
        )}
        <div className="relative z-[1]">
          <TweetCard tweet={rootTweet} variant="thread-root" />
        </div>
      </div>

      {repliesStatus === 'pending' && (
        <div className="flex items-center justify-center p-8 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading replies" />
        </div>
      )}

      {repliesStatus === 'error' && (
        <div className="px-14 py-8 text-sm text-gray-500">
          Unable to load replies.
        </div>
      )}

      {repliesStatus === 'success' &&
        directReplies.length === 0 &&
        !hasNextPage &&
        !isFetchingNextPage && (
        <div className="px-14 py-8 text-sm text-gray-500">
          No replies yet. Start the conversation.
        </div>
      )}

      {repliesStatus === 'success' && directReplies.length > 0 && (
        <div role="list" aria-label="Direct replies">
          {directReplies.map((reply, index) => {
            const isLastReply = index === directReplies.length - 1;

            return (
              <div key={reply._id} role="listitem" className="relative pl-10">
                <span
                  aria-hidden="true"
                  className={`absolute left-9 top-0 w-px bg-[#333639] ${
                    isLastReply ? 'h-7' : 'bottom-0'
                  }`}
                />
                <span
                  aria-hidden="true"
                  className="absolute left-9 top-7 h-px w-5 bg-[#333639]"
                />
                <div
                  className={`relative z-[1] ${
                    isLastReply ? '' : 'border-b border-[#1f2326]'
                  }`}
                >
                  <TweetCard tweet={reply} variant="thread-reply" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(hasNextPage || isFetchingNextPage) && (
        <div ref={loadMoreRef} className="flex h-16 items-center justify-center">
          {isFetchingNextPage && (
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" aria-label="Loading more replies" />
          )}
        </div>
      )}
    </section>
  );
}
