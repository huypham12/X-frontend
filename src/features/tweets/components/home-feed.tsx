'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { tweetService } from '@/features/tweets/api/tweet.service';
import { TweetCard } from './tweet-card';

export function HomeFeed({ type }: { type: 'for-you' | 'following' }) {
  const { ref, inView } = useInView();

  const fetchFeeds = async ({ pageParam }: { pageParam?: string }) => {
    if (type === 'for-you') {
      return tweetService.getForYouFeeds(10, pageParam);
    }
    return tweetService.getNewFeeds(10, pageParam);
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['tweets', 'newsfeed', type],
    queryFn: fetchFeeds,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.next_cursor || undefined,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading tweets...</div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-500">Error loading feeds.</div>;
  }

  const tweets = data?.pages.flatMap((page) => page?.tweets || []) || [];

  if (tweets.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="font-bold text-2xl text-white mb-2">Welcome to X!</div>
        <p>This is the best place to see what’s happening in your world. Find some people and topics to follow now.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {tweets.map((tweet: any) => (
        <TweetCard key={tweet._id || tweet.newsFeedId} tweet={tweet} />
      ))}
      
      {/* Invisible element to trigger intersection observer */}
      <div ref={ref} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && <div className="text-gray-500 text-sm">Loading more...</div>}
        {!hasNextPage && tweets.length > 0 && <div className="text-gray-500 text-sm mt-4 pb-10">You have seen all tweets!</div>}
      </div>
    </div>
  );
}
