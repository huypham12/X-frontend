'use client';
import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Smile, FileText, MapPin, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { tweetService } from '@/features/tweets/api/tweet.service';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { formatDistanceToNowStrict } from 'date-fns';

interface ReplyModalProps {
  tweet: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ReplyModal({ tweet, isOpen, onClose }: ReplyModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    const hashtags = content.match(/#[a-zA-Z0-9_]+/g)?.map((h) => h.slice(1)) || [];
    
    try {
      await tweetService.createTweet({
        type: 2, // TweetType.Comment
        audience: 0, 
        content: content.trim(),
        parent_id: tweet._id,
        hashtags, 
        mentions: [], 
        medias: []
      });
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      onClose();
    } catch (error) {
      console.error('Failed to create reply', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  let timeAgo = '';
  if (tweet.created_at) {
    try {
      timeAgo = formatDistanceToNowStrict(new Date(tweet.created_at));
      timeAgo = timeAgo.replace(' seconds', 's').replace(' minutes', 'm').replace(' hours', 'h').replace(' days', 'd');
    } catch (e) {}
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-14 sm:pt-20 bg-white/10 dark:bg-[#242d34]/40" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div 
        className="bg-black w-full max-w-[600px] sm:rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.2)] flex flex-col max-h-[90vh] overflow-y-auto min-h-[250px]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-2 sticky top-0 bg-black/80 backdrop-blur-md z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pb-4">
          {/* Original Tweet Context */}
          <div className="flex gap-3 relative pb-4">
            <div className="w-10 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#333639] overflow-hidden flex-shrink-0">
                {tweet.author?.avatar ? (
                  <img src={tweet.author.avatar} alt={tweet.author?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
              <div className="w-0.5 bg-[#333639] flex-1 mt-2"></div>
            </div>
            
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-1 text-sm">
                <span className="font-bold hover:underline cursor-pointer">{tweet.author?.name || 'Unknown'}</span>
                <span className="text-gray-500">@{tweet.author?.username || 'unknown'}</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-500">{timeAgo}</span>
              </div>
              <div className="mt-1 text-[15px] whitespace-pre-wrap">
                {tweet.content}
              </div>
              <div className="mt-3 text-sm text-gray-500">
                Replying to <span className="text-[#1d9bf0]">@{tweet.author?.username}</span>
              </div>
            </div>
          </div>

          {/* Reply Area */}
          <div className="flex gap-3 mt-2">
            <div className="w-10 h-10 rounded-full bg-[#333639] overflow-hidden flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-600" />
              )}
            </div>
            
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleInput}
                placeholder="Post your reply"
                className="w-full bg-transparent text-xl placeholder-gray-500 text-white outline-none resize-none min-h-[100px] py-2"
                rows={3}
              />
              
              <div className="border-t border-[#2F3336] mt-2 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[#1d9bf0]">
                  <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 transition-colors">
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 transition-colors">
                    <FileText className="w-5 h-5" />
                  </button>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                  <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 transition-colors opacity-50 cursor-not-allowed">
                    <MapPin className="w-5 h-5" />
                  </button>
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || isSubmitting}
                  className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold py-1.5 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Replying...' : 'Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
