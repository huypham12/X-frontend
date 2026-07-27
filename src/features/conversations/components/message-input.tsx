'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Smile, X } from 'lucide-react';
import { useChatSocket } from '../hooks/use-chat-socket';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useMediaUpload } from '@/features/media/hooks/useMediaUpload';

interface MessageInputProps {
  conversationId: string;
  conversationType: 'direct' | 'group';
}

export const MessageInput: React.FC<MessageInputProps> = ({ conversationId, conversationType }) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { sendMessage, emitTyping } = useChatSocket(conversationId);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    mediaItems,
    isMediaBusy,
    hasMediaError,
    readyMediaIds,
    handleSelectFiles,
    handleRemoveMedia,
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
    if ((!content.trim() && readyMediaIds.length === 0) || isMediaBusy) return;

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSelectFiles(e.target.files);
    }
    // Reset input value so same files can be selected again
    e.target.value = '';
  };

  return (
    <div className="p-4 border-t border-[#2f3336] bg-black">
      {/* Media Previews */}
      {mediaItems.length > 0 && (
        <div className="flex gap-4 mb-4 overflow-x-auto custom-scrollbar pb-2">
          {mediaItems.map((item) => (
            <div key={item.id} className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-[#202327]">
              {item.type === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              )}
              {item.type === 'video' && (
                <video src={item.previewUrl} className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => handleRemoveMedia(item.id)}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
              {item.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-twitter-blue border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-[#202327] rounded-full px-4 py-2 relative">
        <input 
          type="file" 
          multiple 
          accept="image/*,video/*" 
          hidden 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-twitter-blue hover:bg-[#181818] rounded-full transition flex-shrink-0"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        
        <div className="relative" ref={emojiPickerRef}>
          <button 
            type="button" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
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
          className="flex-1 bg-transparent text-white border-none focus:outline-none focus:ring-0 text-[15px]"
        />
        
        <button 
          type="submit" 
          disabled={(!content.trim() && readyMediaIds.length === 0) || isMediaBusy}
          className="p-2 text-twitter-blue disabled:opacity-50 hover:bg-[#181818] rounded-full transition flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
