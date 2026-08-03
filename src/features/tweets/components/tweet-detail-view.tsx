'use client';

import { useEffect, useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { ArrowLeft } from 'lucide-react';
import { tweetService } from '../api/tweet.service';
import { ConversationThread } from './conversation-thread';
import type { Tweet, TweetPage } from '../types/tweet.type';

const ThreadSkeleton = () => (
  <div className="animate-pulse space-y-4 p-4" aria-label="Loading conversation">
    <div className="flex gap-4">
      <div className="h-10 w-10 shrink-0 rounded-full bg-[#181818]" />
      <div className="flex-1 space-y-3">
        <div className="h-4 w-40 rounded bg-[#181818]" />
        <div className="h-4 w-full rounded bg-[#181818]" />
        <div className="h-4 w-2/3 rounded bg-[#181818]" />
        <div className="h-48 rounded-2xl bg-[#181818]" />
      </div>
    </div>
  </div>
);

export function TweetDetailView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tweetId = params.id;
  const focusTweetId = searchParams.get('focus');
  const { ref, inView } = useInView();

  const { data: tweet, isLoading: isTweetLoading } = useQuery({
    queryKey: ['tweets', tweetId],
    queryFn: async () => (await tweetService.getTweet(tweetId)) as Tweet,
    enabled: Boolean(tweetId),
  });

  const {
    data: replies,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: repliesStatus,
  } = useInfiniteQuery({
    queryKey: ['tweets', tweetId, 'replies'],
    queryFn: async ({ pageParam }) => (
      await tweetService.getTweetChildren(tweetId, 10, pageParam as string | undefined)
    ) as TweetPage,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (
      lastPage.has_next_page ? lastPage.next_cursor : undefined
    ),
    enabled: Boolean(tweetId),
  });

  const { data: focusedTweet } = useQuery({
    queryKey: ['tweets', focusTweetId],
    queryFn: async () => {
      if (!focusTweetId) throw new Error('Focused tweet ID is unavailable');
      return (await tweetService.getTweet(focusTweetId)) as Tweet;
    },
    enabled: Boolean(focusTweetId && focusTweetId !== tweetId),
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

  const directChildren = useMemo(() => {
    const loadedReplies = replies?.pages.flatMap((page) => page.tweets ?? []) ?? [];
    if (!focusedTweet || loadedReplies.some((reply) => reply._id === focusedTweet._id)) {
      return loadedReplies;
    }
    return [...loadedReplies, focusedTweet];
  }, [focusedTweet, replies]);

  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-20 border-b border-[#2F3336] bg-black/90 backdrop-blur-md">
        <div className="flex h-[53px] items-center gap-6 px-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Thread</h1>
            <p className="text-xs text-gray-500">Direct replies</p>
          </div>
        </div>
      </header>

      {isTweetLoading && <ThreadSkeleton />}

      {!isTweetLoading && !tweet && (
        <div className="p-8 text-center text-gray-500">Post not found.</div>
      )}

      {tweet && (
        <ConversationThread
          rootTweet={tweet}
          replies={directChildren}
          repliesStatus={repliesStatus}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
          loadMoreRef={ref}
          focusTweetId={focusTweetId}
        />
      )}
    </div>
  );
}
