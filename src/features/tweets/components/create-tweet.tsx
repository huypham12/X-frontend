'use client';
import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Smile, FileText, MapPin } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { tweetService } from '@/features/tweets/api/tweet.service';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useMediaUpload } from '@/features/media/hooks/useMediaUpload';
import { MediaUploadButton } from '@/features/media/components/MediaUploadButton';
import { MediaPreviewGrid } from '@/features/media/components/MediaPreviewGrid';

const EMOJI_LIST = ['😀', '😂', '🥰', '😎', '😭', '😡', '👍', '🙏', '🔥', '✨', '🎉', '❤️'];

interface CreateTweetProps {
  parentId?: string;
  placeholder?: string;
  submitLabel?: string;
  variant?: 'inline' | 'modal' | 'thread';
  autoFocus?: boolean;
  onSuccess?: () => void;
}

export function CreateTweet({
  parentId,
  placeholder = 'What is happening?!',
  submitLabel = 'Post',
  variant = 'inline',
  autoFocus = false,
  onSuccess,
}: CreateTweetProps = {}) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const {
    mediaItems,
    isMediaBusy,
    hasMediaError,
    readyMediaIds,
    errorMessage,
    handleSelectFiles,
    handleRemoveMedia,
    retryUpload,
    continueProcessing,
    clearMedia,
  } = useMediaUpload({ maxFiles: 4 });

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
    if (
      (!content.trim() && readyMediaIds.length === 0) ||
      isSubmitting ||
      isMediaBusy ||
      hasMediaError ||
      readyMediaIds.length !== mediaItems.length
    ) {
      return;
    }

    setIsSubmitting(true);

    const hashtags = content.match(/#[a-zA-Z0-9_]+/g)?.map((h) => h.slice(1)) || [];

    try {
      await tweetService.createTweet({
        type: parentId ? 2 : 0,
        audience: 0,
        content: content.trim(),
        parent_id: parentId ?? null,
        hashtags,
        mentions: [],
        medias: readyMediaIds,
      });
      setContent('');
      clearMedia();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ['tweets', parentId, 'replies'] });
      }
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create tweet', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasReadyMedia = readyMediaIds.length > 0;
  const isPostDisabled =
    (!content.trim() && !hasReadyMedia) ||
    isSubmitting ||
    isMediaBusy ||
    hasMediaError ||
    readyMediaIds.length !== mediaItems.length;
  const hasProcessingMedia = mediaItems.some((item) => item.status === 'processing');
  const hasUploadingMedia = mediaItems.some((item) => item.status === 'uploading');

  const isModal = variant === 'modal';
  const containerClass = isModal
    ? 'flex min-h-0 gap-4 px-4 pb-4'
    : variant === 'thread'
      ? 'flex gap-4 p-4'
      : 'flex gap-4 border-b border-[#2F3336] p-4';
  const editorClass = isModal
    ? 'flex min-h-0 min-w-0 flex-1 flex-col'
    : 'min-w-0 flex-1';
  const contentClass = isModal
    ? 'min-h-0 overflow-y-auto overscroll-contain pr-1'
    : '';
  const textareaClass = isModal
    ? 'max-h-[28dvh] overflow-y-auto'
    : 'overflow-hidden';
  const emojiPickerPosition = isModal ? 'bottom-12' : 'top-10';

  return (
    <div className={containerClass}>
      <div className="w-10 h-10 rounded-full bg-[#333639] overflow-hidden flex-shrink-0">
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-600" />
        )}
      </div>
      <div className={editorClass}>
        <div className={contentClass}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`min-h-[52px] w-full resize-none bg-transparent py-2 text-xl text-white outline-none placeholder:text-gray-500 ${textareaClass}`}
            rows={1}
          />

          <MediaPreviewGrid
            mediaItems={mediaItems}
            onRemove={handleRemoveMedia}
            onRetry={retryUpload}
            onContinueProcessing={continueProcessing}
          />
          {errorMessage && (
            <p role="alert" className="mt-2 text-sm text-red-400">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="relative mt-3 flex shrink-0 items-center justify-between border-t border-[#2F3336] pt-3">
          <div className="flex items-center gap-1 text-[#1d9bf0]">
            <MediaUploadButton 
              onSelectFiles={handleSelectFiles} 
              disabled={isSubmitting || mediaItems.length >= 4}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
            </MediaUploadButton>

            <button
              type="button"
              aria-label="Create a poll"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 transition-colors"
            >
              <FileText className="w-5 h-5" />
            </button>
            
            <div className="relative" ref={emojiPickerRef}>
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                aria-label="Add emoji"
                aria-expanded={showEmojiPicker}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>

              {showEmojiPicker && (
                <div
                  className={`absolute left-0 z-50 grid max-h-[min(240px,45dvh)] w-[min(16rem,calc(100vw-6rem))] grid-cols-4 gap-1 overflow-y-auto rounded-xl border border-[#2F3336] bg-black p-3 shadow-xl ${emojiPickerPosition}`}
                >
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      type="button"
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

            <button
              type="button"
              aria-label="Add location"
              disabled
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 transition-colors opacity-50 cursor-not-allowed"
            >
              <MapPin className="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPostDisabled}
            className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold py-1.5 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting
              ? parentId
                ? 'Replying...'
                : 'Posting...'
              : hasUploadingMedia
                ? 'Uploading...'
                : hasProcessingMedia
                  ? 'Processing...'
                  : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
