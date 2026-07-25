'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { tweetService } from '@/features/tweets/api/tweet.service';
import { TweetCard } from '@/features/tweets/components/tweet-card';

export function ProfileFeed({ username, activeTab = 'posts' }: { username: string, activeTab?: 'posts' | 'replies' | 'bookmarks' | 'media' | 'likes' }) {
  const { ref, inView } = useInView();

  const fetchFeeds = async ({ pageParam }: { pageParam?: string }) => {
    switch (activeTab) {
      case 'replies':
        return tweetService.getUserReplies(username, 10, pageParam);
      case 'bookmarks':
        return tweetService.getBookmarks(10, pageParam);
      case 'media':
        return tweetService.getUserMedia(username, 10, pageParam);
      case 'likes':
        return tweetService.getUserLikes(username, 10, pageParam);
      case 'posts':
      default:
        return tweetService.getUserTweets(username, 10, pageParam);
    }
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['tweets', 'user', username, activeTab],
    queryFn: fetchFeeds,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.result?.next_cursor || undefined,
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
    return <div className="p-8 text-center text-red-500">Error loading tweets.</div>;
  }

  const tweets = data?.pages.flatMap((page) => page.result?.tweets || []) || [];

  if (tweets.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center max-w-[400px] mx-auto mt-8">
        <h2 className="text-3xl font-bold mb-2">Nothing to see here — yet</h2>
        <p className="text-gray-500 mb-6">When they post tweets, they will show up here.</p>
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
