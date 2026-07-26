'use client';
import { useState } from 'react';
import { MessageCircle, Repeat2, Heart, BarChart2, Share, Bookmark, FileText } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import { tweetService } from '@/features/tweets/api/tweet.service';
import Link from 'next/link';
import { ReplyModal } from './reply-modal';
import { QuoteModal } from './quote-modal';
import { useRouter } from 'next/navigation';
import { MediaGallery } from '@/features/media/components/viewers/MediaGallery';
import { TweetMenu } from './tweet-menu';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useQueryClient } from '@tanstack/react-query';
import type { Tweet, TweetPage } from '../types/tweet.type';

type TweetCache = {
  pages?: Array<Partial<TweetPage>>;
};

interface TweetCardProps {
  tweet: Tweet;
  variant?: 'feed' | 'thread-root' | 'thread-reply';
}

export function TweetCard({ tweet, variant = 'feed' }: TweetCardProps) {
  const displayTweetId = tweet.type === 1 && tweet.parent_tweet
    ? tweet.parent_tweet._id
    : tweet._id;

  return <TweetCardContent key={displayTweetId} tweet={tweet} variant={variant} />;
}

function TweetCardContent({ tweet, variant }: Required<TweetCardProps>) {
  const currentUser = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const router = useRouter();
  const isRetweet = tweet.type === 1;
  const isQuoteTweet = tweet.type === 3;
  const displayTweet = (isRetweet && tweet.parent_tweet) ? tweet.parent_tweet : tweet;

  const [isLiked, setIsLiked] = useState(displayTweet.is_liked || false);
  const [isBookmarked, setIsBookmarked] = useState(displayTweet.is_bookmarked || false);
  const [likeCount, setLikeCount] = useState(displayTweet.like_count || 0);
  const [bookmarkCount, setBookmarkCount] = useState(displayTweet.bookmark_count || 0);
  const [retweetCount, setRetweetCount] = useState(displayTweet.retweet_count || 0);
  const [isRetweeted, setIsRetweeted] = useState(displayTweet.is_retweeted || false);

  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [showRetweetMenu, setShowRetweetMenu] = useState(false);
  type ToggleLikeVariables = { shouldLike: boolean };
  type ToggleBookmarkVariables = { shouldBookmark: boolean };

  // Helper to update a tweet across all cached React Query data (avoids full refetch)
  const updateTweetInCache = (tweetId: string, updater: (tweet: Tweet) => Tweet) => {
    queryClient.setQueriesData<TweetCache>(
      { queryKey: ['tweets'] },
      (oldData) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            if (!page?.tweets) return page;
            return {
              ...page,
              tweets: page.tweets.map((t) => {
                if (t._id === tweetId) return updater(t);
                if (t.parent_tweet?._id === tweetId) {
                  return { ...t, parent_tweet: updater(t.parent_tweet) };
                }
                return t;
              })
            };
          })
        };
      }
    );
  };

  const likeMutation = useMutation({
    mutationFn: ({ shouldLike }: ToggleLikeVariables) => shouldLike
      ? tweetService.likeTweet(displayTweet._id)
      : tweetService.unlikeTweet(displayTweet._id),
    onMutate: ({ shouldLike }) => {
      setIsLiked(shouldLike);
      setLikeCount((prev: number) => shouldLike ? prev + 1 : prev - 1);
      updateTweetInCache(displayTweet._id, (t) => ({
        ...t,
        is_liked: shouldLike,
        like_count: Math.max(0, (t.like_count || 0) + (shouldLike ? 1 : -1))
      }));
    },
    onError: (_error, variables) => {
      const shouldLike = !variables?.shouldLike;
      setIsLiked(shouldLike);
      setLikeCount((prev: number) => shouldLike ? prev + 1 : prev - 1);
      updateTweetInCache(displayTweet._id, (t) => ({
        ...t,
        is_liked: shouldLike,
        like_count: Math.max(0, (t.like_count || 0) + (shouldLike ? 1 : -1))
      }));
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: ({ shouldBookmark }: ToggleBookmarkVariables) => shouldBookmark
      ? tweetService.bookmarkTweet(displayTweet._id)
      : tweetService.unbookmarkTweet(displayTweet._id),
    onMutate: ({ shouldBookmark }) => {
      setIsBookmarked(shouldBookmark);
      setBookmarkCount((prev: number) => shouldBookmark ? prev + 1 : prev - 1);
      updateTweetInCache(displayTweet._id, (t) => ({
        ...t,
        is_bookmarked: shouldBookmark,
        bookmark_count: Math.max(0, (t.bookmark_count || 0) + (shouldBookmark ? 1 : -1))
      }));
    },
    onError: (_error, variables) => {
      const shouldBookmark = !variables?.shouldBookmark;
      setIsBookmarked(shouldBookmark);
      setBookmarkCount((prev: number) => shouldBookmark ? prev + 1 : prev - 1);
      updateTweetInCache(displayTweet._id, (t) => ({
        ...t,
        is_bookmarked: shouldBookmark,
        bookmark_count: Math.max(0, (t.bookmark_count || 0) + (shouldBookmark ? 1 : -1))
      }));
    }
  });

  const retweetMutation = useMutation({
    mutationFn: () => tweetService.createTweet({
      type: 1, // TweetType.Retweet
      audience: 0,
      content: '',
      parent_id: displayTweet._id,
      hashtags: [],
      mentions: [],
      medias: []
    }),
    onSuccess: () => {
      setIsRetweeted(true);
      setRetweetCount((prev: number) => prev + 1);
      setShowRetweetMenu(false);
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
    }
  });

  // Calculate time ago
  let timeAgo = '';
  try {
    if (displayTweet.created_at) {
      timeAgo = formatDistanceToNowStrict(new Date(displayTweet.created_at));
      timeAgo = timeAgo.replace(' seconds', 's').replace(' minutes', 'm').replace(' hours', 'h').replace(' days', 'd');
    }
  } catch {
    timeAgo = '';
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    likeMutation.mutate({ shouldLike: !isLiked });
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bookmarkMutation.mutate({ shouldBookmark: !isBookmarked });
  };

  const handleRetweetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowRetweetMenu(!showRetweetMenu);
  };

  const unretweetMutation = useMutation({
    mutationFn: () => tweetService.unretweet(displayTweet._id),
    onSuccess: () => {
      setIsRetweeted(false);
      setRetweetCount((prev: number) => Math.max(0, prev - 1));
      setShowRetweetMenu(false);
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
    }
  });

  const handleRetweet = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRetweeted) {
      unretweetMutation.mutate();
    } else {
      retweetMutation.mutate();
    }
  };

  const handleQuoteTweet = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowRetweetMenu(false);
    setIsQuoteModalOpen(true);
  };

  const handleCardClick = () => {
    router.push(`/tweet/${displayTweet._id}`);
  };

  const cardClass = variant === 'feed'
    ? 'border-b border-[#2F3336] hover:bg-white/5'
    : 'hover:bg-white/[0.03]';

  return (
    <>
    <article
      onClick={handleCardClick}
      className={`${cardClass} flex cursor-pointer flex-col outline-none transition-colors`}
    >
      {isRetweet && tweet.parent_tweet && (
        <div className="flex items-center gap-2 text-gray-500 text-[13px] font-bold pt-3 px-4 ml-10">
          <Repeat2 className="w-4 h-4" />
          <span>{currentUser?._id === tweet.user_id ? 'Bạn' : tweet.author?.name} đã đăng lại</span>
        </div>
      )}
      <div className="p-4 flex gap-4 pt-2">
      <Link href={`/profile/${displayTweet.author?.username}`} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-10 bg-[#333639] rounded-full flex-shrink-0 overflow-hidden">
          {displayTweet.author?.avatar ? (
            <img src={displayTweet.author.avatar} alt={displayTweet.author?.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>
      </Link>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <Link href={`/profile/${displayTweet.author?.username}`} className="flex items-center gap-2 truncate group" onClick={(e) => e.stopPropagation()}>
            <span className="font-bold group-hover:underline truncate">{displayTweet.author?.name || 'Unknown'}</span>
            <span className="text-gray-500 truncate">@{displayTweet.author?.username || 'unknown'}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500 text-sm hover:underline shrink-0">
              {timeAgo}
            </span>
          </Link>
          <TweetMenu tweet={displayTweet} />
        </div>
        
        <div className="mt-1 text-[15px] whitespace-pre-wrap break-words leading-relaxed">
          {(displayTweet.content ?? '').split(/(#[a-zA-Z0-9_]+)/g).map((part: string, i: number) => {
            if (part.startsWith('#')) {
              // Extract the word without '#' for the search query
              const tag = part.slice(1);
              return (
                <Link 
                  key={i} 
                  href={`/search?q=${encodeURIComponent('%23' + tag)}`} 
                  onClick={(e) => e.stopPropagation()} 
                  className="text-[#1d9bf0] hover:underline"
                >
                  {part}
                </Link>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
        
                <MediaGallery medias={displayTweet.medias_info ?? []} />
        
        {isQuoteTweet && displayTweet.parent_tweet && (
          <div 
            className="mt-3 border border-[#2F3336] rounded-xl p-3 hover:bg-white/5 transition-colors"
            onClick={(e) => { e.stopPropagation(); router.push(`/tweet/${displayTweet.parent_tweet!._id}`); }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 bg-[#333639] rounded-full overflow-hidden">
                {displayTweet.parent_tweet.author?.avatar && (
                  <img src={displayTweet.parent_tweet.author.avatar} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <span className="font-bold text-[15px]">{displayTweet.parent_tweet.author?.name}</span>
              <span className="text-gray-500 text-[15px]">@{displayTweet.parent_tweet.author?.username}</span>
            </div>
            <div className="text-[15px] whitespace-pre-wrap break-words leading-relaxed mb-2">
              {displayTweet.parent_tweet.content}
            </div>
            {displayTweet.parent_tweet.medias_info && displayTweet.parent_tweet.medias_info.length > 0 && (
              <MediaGallery medias={displayTweet.parent_tweet.medias_info} />
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center justify-between mt-3 text-gray-500 max-w-md">
          <div 
            className="flex items-center gap-2 group hover:text-[#1d9bf0] transition-colors cursor-pointer" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsReplyModalOpen(true); }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#1d9bf0]/10 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-xs">{displayTweet.reply_count || 0}</span>
          </div>
          
          <div className="relative">
            <div 
              className={`flex items-center gap-2 group transition-colors cursor-pointer ${isRetweeted ? 'text-[#00ba7c]' : 'hover:text-[#00ba7c]'}`} 
              onClick={handleRetweetClick}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isRetweeted ? 'bg-[#00ba7c]/10' : 'group-hover:bg-[#00ba7c]/10'}`}>
                <Repeat2 className="w-4 h-4" />
              </div>
              <span className="text-xs">{retweetCount}</span>
            </div>
            {showRetweetMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowRetweetMenu(false); }}></div>
                <div className="absolute top-full left-0 mt-1 bg-black shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-xl py-2 w-40 z-50 overflow-hidden text-white" onClick={e => e.stopPropagation()}>
                  <button onClick={handleRetweet} className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors flex items-center gap-3">
                    <Repeat2 className="w-4 h-4" />
                    <span className="font-bold text-[15px]">{isRetweeted ? 'Undo Retweet' : 'Retweet'}</span>
                  </button>
                  <button onClick={handleQuoteTweet} className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors flex items-center gap-3">
                    <FileText className="w-4 h-4" />
                    <span className="font-bold text-[15px]">Quote</span>
                  </button>
                </div>
              </>
            )}
          </div>
          
          <div 
            className={`flex items-center gap-2 group transition-colors cursor-pointer ${isLiked ? 'text-[#f91880]' : 'hover:text-[#f91880]'}`}
            onClick={handleLike}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isLiked ? 'bg-[#f91880]/10' : 'group-hover:bg-[#f91880]/10'}`}>
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </div>
            <span className="text-xs">{likeCount}</span>
          </div>
          
          <div className="flex items-center gap-2 group hover:text-[#1d9bf0] transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#1d9bf0]/10 transition-colors">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span className="text-xs">{displayTweet.user_views || displayTweet.guest_views || 0}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isBookmarked ? 'text-[#1d9bf0] bg-[#1d9bf0]/10' : 'text-gray-500 hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10'}`}
              onClick={handleBookmark}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <Share className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
      
      </div>
    </article>

    <ReplyModal
      tweet={displayTweet}
      isOpen={isReplyModalOpen}
      onClose={() => setIsReplyModalOpen(false)}
    />

    <QuoteModal
      tweet={displayTweet}
      isOpen={isQuoteModalOpen}
      onClose={() => setIsQuoteModalOpen(false)}
    />
    </>
  );
}
