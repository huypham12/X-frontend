'use client';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { tweetService } from '@/features/tweets/api/tweet.service';
import { TweetCard } from '@/features/tweets/components/tweet-card';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { CreateTweet } from '@/features/tweets/components/create-tweet'; // Assuming it can be reused, but wait, CreateTweet currently doesn't take parent_id. 
// Instead, I'll just show the replies for now. To reply, the user can use the ReplyModal from TweetCard.

export default function TweetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tweet_id = params.id as string;
  const { ref, inView } = useInView();

  const { data: tweet, isLoading: isTweetLoading } = useQuery({
    queryKey: ['tweets', tweet_id],
    queryFn: () => tweetService.getTweet(tweet_id),
    enabled: !!tweet_id
  });

  const {
    data: replies,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ['tweets', tweet_id, 'replies'],
    queryFn: async ({ pageParam }) => {
      return tweetService.getTweetChildren(tweet_id, 10, pageParam as string | undefined);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage?.data?.has_next_page ? lastPage.data.next_cursor : undefined;
    },
    enabled: !!tweet_id
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  return (
    <div className="w-full flex">
      {/* Main Content */}
      <div className="w-full max-w-[600px] border-x border-[#2F3336] min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md">
          <div className="flex items-center px-4 h-[53px] gap-6">
            <button 
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Post</h1>
          </div>
        </div>

        {/* Original Tweet */}
        {isTweetLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#1d9bf0]" />
          </div>
        ) : tweet ? (
          <div>
            <TweetCard tweet={tweet.data || tweet} />
            <div className="border-b border-[#2F3336]">
              {/* Optional: Add a quick reply box here */}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Post not found.
          </div>
        )}

        {/* Replies */}
        {status === 'pending' ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#1d9bf0]" />
          </div>
        ) : status === 'error' ? (
          <div className="text-center p-8 text-gray-500">
            Error loading replies.
          </div>
        ) : (
          <div>
            {replies.pages.flatMap((page) => page.data?.tweets || []).map((reply: any) => (
              <TweetCard key={reply._id} tweet={reply} />
            ))}
            <div ref={ref} className="h-20 flex items-center justify-center">
              {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-[#1d9bf0]" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
