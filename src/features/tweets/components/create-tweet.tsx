'use client';
import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Smile, FileText, MapPin, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tweetService } from '@/features/tweets/api/tweet.service';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useMediaUpload } from '@/features/media/hooks/useMediaUpload';
import { MediaUploadButton } from '@/features/media/components/MediaUploadButton';
import { MediaPreviewGrid } from '@/features/media/components/MediaPreviewGrid';

const EMOJI_LIST = ['😀', '😂', '🥰', '😎', '😭', '😡', '👍', '🙏', '🔥', '✨', '🎉', '❤️'];

export function CreateTweet() {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const { mediaItems, isUploading, handleSelectFiles, handleRemoveMedia, clearMedia } = useMediaUpload({ maxFiles: 4 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = async () => {
    // Only block if there's no text AND no media
    const hasMedia = mediaItems.length > 0;
    if ((!content.trim() && !hasMedia) || isSubmitting || isUploading) return;
    
    setIsSubmitting(true);
    
    // Extract hashtags from content
    const hashtags = content.match(/#[a-zA-Z0-9_]+/g)?.map((h) => h.slice(1)) || [];
    
    // Get successfully uploaded media IDs
    const uploadedMediaIds = mediaItems
      .filter((m) => m.status === 'success' && m.backendId)
      .map((m) => m.backendId as string);

    try {
      await tweetService.createTweet({
        type: 0, 
        audience: 0, 
        content: content.trim(),
        parent_id: null,
        hashtags, 
        mentions: [], 
        medias: uploadedMediaIds
      });
      setContent('');
      clearMedia();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
    } catch (error) {
      console.error('Failed to create tweet', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPostDisabled = (!content.trim() && mediaItems.length === 0) || isSubmitting || isUploading;

  return (
    <div className="border-b border-[#2F3336] p-4 flex gap-4">
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
          placeholder="What is happening?!"
          className="w-full bg-transparent text-xl placeholder-gray-500 text-white outline-none resize-none min-h-[52px] py-2 overflow-hidden"
          rows={1}
        />

        <MediaPreviewGrid mediaItems={mediaItems} onRemove={handleRemoveMedia} />

        <div className="border-t border-[#2F3336] mt-3 pt-3 flex items-center justify-between relative">
          <div className="flex items-center gap-1 text-[#1d9bf0]">
            <MediaUploadButton 
              onSelectFiles={handleSelectFiles} 
              disabled={isUploading || isSubmitting}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
            </MediaUploadButton>

            <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 transition-colors">
              <FileText className="w-5 h-5" />
            </button>
            
            <div className="relative" ref={emojiPickerRef}>
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>

              {showEmojiPicker && (
                <div className="absolute top-10 z-50 bg-black border border-[#2F3336] rounded-xl shadow-xl p-3 w-64 flex flex-wrap gap-2">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="text-2xl hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 transition-colors opacity-50 cursor-not-allowed">
              <MapPin className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isPostDisabled}
            className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold py-1.5 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

