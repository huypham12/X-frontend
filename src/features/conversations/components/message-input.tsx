'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Smile } from 'lucide-react';
import { useChatSocket } from '../hooks/use-chat-socket';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useMediaUpload } from '@/features/media/hooks/useMediaUpload';
import { MediaPreviewGrid } from '@/features/media/components/MediaPreviewGrid';
import { MediaUploadButton } from '@/features/media/components/MediaUploadButton';

interface MessageInputProps {
  conversationId: string;
  conversationType: 'direct' | 'group';
  partnerUsername?: string;
  disabledReason?: string;
  isMessagingAvailabilityLoading?: boolean;
  onRetryMessagingAvailability?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  conversationType,
  partnerUsername,
  disabledReason,
  isMessagingAvailabilityLoading = false,
  onRetryMessagingAvailability,
}) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { sendMessage, emitTyping } = useChatSocket(conversationId, partnerUsername);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      isComposerDisabled ||
      isSending ||
      (!content.trim() && readyMediaIds.length === 0) ||
      isMediaBusy ||
      hasMediaError ||
      readyMediaIds.length !== mediaItems.length
    ) {
      return;
    }

    setIsSending(true);
    const wasSent = await sendMessage({
      conversation_id: conversationId,
      conversation_type: conversationType,
      content: content.trim(),
      media_ids: readyMediaIds,
    });
    setIsSending(false);

    if (!wasSent) return;
    
    setContent('');
    clearMedia();
    emitTyping({ conversation_id: conversationId, conversation_type: conversationType, isTyping: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComposerDisabled) return;

    setContent(e.target.value);
    
    // Simple typing indicator emit
    if (e.target.value.length === 1) {
      emitTyping({ conversation_id: conversationId, conversation_type: conversationType, isTyping: true });
    } else if (e.target.value.length === 0) {
      emitTyping({ conversation_id: conversationId, conversation_type: conversationType, isTyping: false });
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => prev + emojiData.emoji);
  };

  const isComposerDisabled =
    conversationType === 'direct' &&
    (isMessagingAvailabilityLoading || Boolean(disabledReason));
  const composerStatus = isMessagingAvailabilityLoading
    ? 'Checking whether direct messaging is available…'
    : disabledReason;
  const isSendDisabled =
    isComposerDisabled ||
    isSending ||
    (!content.trim() && readyMediaIds.length === 0) ||
    isMediaBusy ||
    hasMediaError ||
    readyMediaIds.length !== mediaItems.length;

  const hasPreviewContent = mediaItems.length > 0 || Boolean(errorMessage);

  return (
    <div className="relative z-20 shrink-0 border-t border-[#2f3336] bg-black p-4">
      {hasPreviewContent && (
        <div className="custom-scrollbar max-h-[40dvh] overflow-y-auto overscroll-contain pb-3">
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
      )}

      {composerStatus && (
        <div
          id={`message-composer-status-${conversationId}`}
          role="status"
          className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-[#121212] px-4 py-3 text-sm leading-5 text-gray-400"
        >
          <span>{composerStatus}</span>
          {!isMessagingAvailabilityLoading && onRetryMessagingAvailability && (
            <button
              type="button"
              onClick={onRetryMessagingAvailability}
              className="shrink-0 rounded-full border border-[#536471] px-3 py-1 font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative flex items-center gap-2 rounded-full bg-[#202327] px-4 py-2">
        <MediaUploadButton
          onSelectFiles={handleSelectFiles}
          maxFiles={4}
          disabled={isComposerDisabled || isSending || mediaItems.length >= 4}
          className="p-2 text-twitter-blue hover:bg-[#181818] rounded-full transition flex-shrink-0"
        >
          <ImageIcon className="w-5 h-5" />
        </MediaUploadButton>
        
        <div className="relative" ref={emojiPickerRef}>
          <button 
            type="button" 
            disabled={isComposerDisabled || isSending}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            aria-label="Choose an emoji"
            aria-expanded={showEmojiPicker}
            className="p-2 text-twitter-blue hover:bg-[#181818] rounded-full transition flex-shrink-0"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          {showEmojiPicker && !isComposerDisabled && !isSending && (
            <div className="absolute bottom-full left-0 mb-2 z-50">
              <EmojiPicker 
                onEmojiClick={onEmojiClick} 
                theme={Theme.DARK}
                lazyLoadEmojis={true}
              />
            </div>
          )}
        </div>
        
        <input
          type="text"
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isComposerDisabled || isSending}
          placeholder={
            isSending
              ? 'Sending…'
              : isComposerDisabled
                ? 'Direct messaging unavailable'
                : 'Start a new message'
          }
          aria-label="Message"
          aria-describedby={composerStatus ? `message-composer-status-${conversationId}` : undefined}
          className="flex-1 bg-transparent text-white border-none focus:outline-none focus:ring-0 text-[15px]"
        />
        
        <button 
          type="submit" 
          disabled={isSendDisabled}
          aria-label="Send message"
          className="p-2 text-twitter-blue disabled:opacity-50 hover:bg-[#181818] rounded-full transition flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
