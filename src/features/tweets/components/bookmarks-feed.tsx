'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { tweetService } from '@/features/tweets/api/tweet.service';
import { TweetCard } from './tweet-card';
import { Loader2 } from 'lucide-react';

export function BookmarksFeed() {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['tweets', 'bookmarks'],
    queryFn: async ({ pageParam }) => {
      return tweetService.getBookmarks(10, pageParam as string | undefined);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage?.data?.has_next_page ? lastPage.data.next_cursor : undefined;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  if (status === 'pending') {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#1d9bf0]" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center p-8 text-gray-500">
        Something went wrong while fetching bookmarks.
      </div>
    );
  }

  const tweets = data?.pages.flatMap((page) => page.data?.tweets || []) || [];

  if (tweets.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <h2 className="text-xl font-bold text-white mb-2">Save Tweets for later</h2>
        <p>Don't let the good ones fly away! Bookmark Tweets to easily find them again in the future.</p>
      </div>
    );
  }

  return (
    <div>
      {tweets.map((tweet: any) => (
        <TweetCard key={tweet._id} tweet={tweet} />
      ))}
      <div ref={ref} className="h-20 flex items-center justify-center">
        {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-[#1d9bf0]" />}
      </div>
    </div>
  );
}
