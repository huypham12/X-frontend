'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { CreateTweet } from './create-tweet';

interface CreateTweetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTweetModal({ isOpen, onClose }: CreateTweetModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-tweet-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#242d34]/60 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="isolate flex max-h-[calc(100dvh-1.5rem)] min-h-[180px] w-full max-w-[600px] flex-col overflow-visible rounded-2xl border border-[#2F3336] bg-black shadow-[0_12px_40px_rgba(0,0,0,0.65)] sm:max-h-[calc(100dvh-3rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="z-10 flex shrink-0 items-center px-4 py-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close post composer"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 id="create-tweet-title" className="sr-only">Create a post</h2>
        </div>

        <CreateTweet
          variant="modal"
          autoFocus
          onSuccess={onClose}
        />
      </div>
    </div>,
    document.body
  );
}
