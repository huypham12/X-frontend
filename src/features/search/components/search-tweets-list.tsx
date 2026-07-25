'use client';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/features/search/api/search.service';
import { TweetCard } from '@/features/tweets/components/tweet-card';

export function SearchTweetsList({ query }: { query: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['search-tweets', query],
    queryFn: () => searchService.searchTweets(query),
    enabled: !!query,
  });

  const tweets = data?.data?.tweets || [];

  if (isLoading) {
    return <div className="text-center text-gray-500 py-8">Searching tweets...</div>;
  }

  if (tweets.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center max-w-[400px] mx-auto mt-8">
        <h2 className="text-3xl font-bold mb-2">No results for &quot;{query}&quot;</h2>
        <p className="text-gray-500 mb-6">Try searching for something else, or check your spelling.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {tweets.map((tweet: any) => (
        <TweetCard key={tweet._id} tweet={tweet} />
      ))}
    </div>
  );
}
