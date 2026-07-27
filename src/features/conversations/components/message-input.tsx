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
}

export const MessageInput: React.FC<MessageInputProps> = ({ conversationId, conversationType }) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { sendMessage, emitTyping } = useChatSocket(conversationId);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (!content.trim() && readyMediaIds.length === 0) ||
      isMediaBusy ||
      hasMediaError ||
      readyMediaIds.length !== mediaItems.length
    ) {
      return;
    }

    sendMessage({
      conversation_id: conversationId,
      conversation_type: conversationType,
      content: content.trim(),
      media_ids: readyMediaIds,
    });
    
    setContent('');
    clearMedia();
    emitTyping({ conversation_id: conversationId, conversation_type: conversationType, isTyping: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const isSendDisabled =
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

      <form onSubmit={handleSubmit} className="relative flex items-center gap-2 rounded-full bg-[#202327] px-4 py-2">
        <MediaUploadButton
          onSelectFiles={handleSelectFiles}
          maxFiles={4}
          disabled={mediaItems.length >= 4}
          className="p-2 text-twitter-blue hover:bg-[#181818] rounded-full transition flex-shrink-0"
        >
          <ImageIcon className="w-5 h-5" />
        </MediaUploadButton>
        
        <div className="relative" ref={emojiPickerRef}>
          <button 
            type="button" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            aria-label="Choose an emoji"
            aria-expanded={showEmojiPicker}
            className="p-2 text-twitter-blue hover:bg-[#181818] rounded-full transition flex-shrink-0"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          {showEmojiPicker && (
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
          placeholder="Start a new message"
          aria-label="Message"
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
