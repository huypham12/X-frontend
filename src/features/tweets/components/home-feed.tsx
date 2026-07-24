'use client';
import { CreateTweet } from '@/features/tweets/components/create-tweet';
import { TweetCard } from '@/features/tweets/components/tweet-card';
import { useQuery } from '@tanstack/react-query';
import { tweetService } from '@/features/tweets/api/tweet.service';

export function HomeFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ['feeds'],
    queryFn: () => tweetService.getFeeds(1, 20),
  });

  // Sử dụng dữ liệu mock nếu API chưa có data
  const tweets = data?.result?.tweets || data?.result || [
    { _id: '1', content: "Hello world! This is my first tweet on X-Clone 🚀", user: { name: 'Admin', username: 'admin' } },
    { _id: '2', content: "Just setting up my new profile. Excited to be here!", user: { name: 'Guest', username: 'guest' } }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2F3336]">
        <div className="flex justify-between items-center px-4 h-14">
          <h1 className="font-bold text-xl cursor-pointer">Home</h1>
        </div>
        <div className="flex w-full">
          <div className="flex-1 hover:bg-[#181818] cursor-pointer transition-colors flex justify-center items-center h-14">
            <div className="relative h-full flex items-center">
              <span className="font-bold">For you</span>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[#1d9bf0] rounded-full" />
            </div>
          </div>
          <div className="flex-1 hover:bg-[#181818] cursor-pointer transition-colors flex justify-center items-center h-14 text-gray-500">
            <span className="font-medium">Following</span>
          </div>
        </div>
      </div>

      <CreateTweet />

      {/* Feeds */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-[#1d9bf0] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="pb-[100px]">
          {Array.isArray(tweets) && tweets.map((tweet: any, index: number) => (
            <TweetCard key={tweet._id || index} tweet={tweet} />
          ))}
        </div>
      )}
    </div>
  );
}
