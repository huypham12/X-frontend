'use client';
import { useState } from 'react';
import { MessageCircle, Repeat2, Heart, BarChart2, Share, MoreHorizontal, Bookmark, FileText } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import { tweetService } from '@/features/tweets/api/tweet.service';
import Link from 'next/link';
import { ReplyModal } from './reply-modal';
import { QuoteModal } from './quote-modal';
import { useRouter } from 'next/navigation';
import { MediaGallery } from '@/features/media/components/viewers/MediaGallery';

export function TweetCard({ tweet }: { tweet: any }) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(tweet.is_liked || false);
  const [isBookmarked, setIsBookmarked] = useState(tweet.is_bookmarked || false);
  const [likeCount, setLikeCount] = useState(tweet.like_count || 0);
  const [bookmarkCount, setBookmarkCount] = useState(tweet.bookmark_count || 0);
  const [retweetCount, setRetweetCount] = useState(tweet.retweet_count || 0);
  
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [showRetweetMenu, setShowRetweetMenu] = useState(false);

  const likeMutation = useMutation({
    mutationFn: () => isLiked ? tweetService.unlikeTweet(tweet._id) : tweetService.likeTweet(tweet._id),
    onMutate: () => {
      setIsLiked(!isLiked);
      setLikeCount((prev: number) => isLiked ? prev - 1 : prev + 1);
    },
    onError: () => {
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount((prev: number) => isLiked ? prev - 1 : prev + 1);
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => isBookmarked ? tweetService.unbookmarkTweet(tweet._id) : tweetService.bookmarkTweet(tweet._id),
    onMutate: () => {
      setIsBookmarked(!isBookmarked);
      setBookmarkCount((prev: number) => isBookmarked ? prev - 1 : prev + 1);
    },
    onError: () => {
      // Revert on error
      setIsBookmarked(!isBookmarked);
      setBookmarkCount((prev: number) => isBookmarked ? prev - 1 : prev + 1);
    }
  });

  const retweetMutation = useMutation({
    mutationFn: () => tweetService.createTweet({
      type: 1, // TweetType.Retweet
      audience: 0,
      content: '',
      parent_id: tweet._id,
      hashtags: [],
      mentions: [],
      medias: []
    }),
    onSuccess: () => {
      setRetweetCount((prev: number) => prev + 1);
      setShowRetweetMenu(false);
    }
  });

  // Calculate time ago
  let timeAgo = '';
  try {
    if (tweet.created_at) {
      timeAgo = formatDistanceToNowStrict(new Date(tweet.created_at));
      timeAgo = timeAgo.replace(' seconds', 's').replace(' minutes', 'm').replace(' hours', 'h').replace(' days', 'd');
    }
  } catch (e) {
    timeAgo = '';
  }

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    likeMutation.mutate();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bookmarkMutation.mutate();
  };

  const handleRetweetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowRetweetMenu(!showRetweetMenu);
  };

  const handleRetweet = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    retweetMutation.mutate();
  };

  const handleQuoteTweet = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowRetweetMenu(false);
    setIsQuoteModalOpen(true);
  };

  const handleCardClick = () => {
    router.push(`/tweet/${tweet._id}`);
  };

  return (
    <div onClick={handleCardClick} className="border-b border-[#2F3336] p-4 flex gap-4 hover:bg-white/5 transition-colors cursor-pointer outline-none">
      <Link href={`/profile/${tweet.author?.username}`} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-10 bg-[#333639] rounded-full flex-shrink-0 overflow-hidden">
          {tweet.author?.avatar ? (
            <img src={tweet.author.avatar} alt={tweet.author?.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>
      </Link>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <Link href={`/profile/${tweet.author?.username}`} className="flex items-center gap-2 truncate group" onClick={(e) => e.stopPropagation()}>
            <span className="font-bold group-hover:underline truncate">{tweet.author?.name || 'Unknown'}</span>
            <span className="text-gray-500 truncate">@{tweet.author?.username || 'unknown'}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500 text-sm hover:underline shrink-0">
              {timeAgo}
            </span>
          </Link>
          <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 group transition-colors shrink-0">
            <MoreHorizontal className="w-5 h-5 text-gray-500 group-hover:text-[#1d9bf0]" />
          </div>
        </div>
        
        <div className="mt-1 text-[15px] whitespace-pre-wrap break-words leading-relaxed">
          {tweet.content}
        </div>
        
        <MediaGallery medias={tweet.medias_info} />
        
        {/* Actions */}
        <div className="flex items-center justify-between mt-3 text-gray-500 max-w-md">
          <div 
            className="flex items-center gap-2 group hover:text-[#1d9bf0] transition-colors cursor-pointer" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsReplyModalOpen(true); }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#1d9bf0]/10 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-xs">{tweet.reply_count || 0}</span>
          </div>
          
          <div className="relative">
            <div 
              className="flex items-center gap-2 group hover:text-[#00ba7c] transition-colors cursor-pointer" 
              onClick={handleRetweetClick}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#00ba7c]/10 transition-colors">
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
                    <span className="font-bold text-[15px]">Retweet</span>
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
            <span className="text-xs">{tweet.user_views || tweet.guest_views || 0}</span>
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

      <ReplyModal 
        tweet={tweet} 
        isOpen={isReplyModalOpen} 
        onClose={() => setIsReplyModalOpen(false)} 
      />
      
      <QuoteModal
        tweet={tweet}
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </div>
  );
}
