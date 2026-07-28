'use client';

import { useEffect, useRef, useState } from 'react';
import { Ellipsis, Reply, Undo2 } from 'lucide-react';
import type { Message } from '../types';
import { useMessageComposerStore } from '../stores/message-composer.store';

interface MessageActionsMenuProps {
  message: Message;
  isMine: boolean;
  isRevokePending?: boolean;
  onRequestRevoke?: (message: Message) => void;
}

export const MessageActionsMenu = ({
  message,
  isMine,
  isRevokePending = false,
  onRequestRevoke,
}: MessageActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const startReply = useMessageComposerStore((state) => state.startReply);

  useEffect(() => {
    if (!isOpen) return;

    firstActionRef.current?.focus();
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const closeAndRestoreFocus = () => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const handleReply = () => {
    startReply(message.conversation_id, message);
    setIsOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById(`message-input-${message.conversation_id}`)?.focus();
    });
  };

  if (message.status !== 'sent') return null;

  return (
    <div ref={rootRef} className="relative shrink-0 self-center">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Message actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex h-11 w-11 items-center justify-center rounded-full text-gray-400 opacity-100 transition-[background-color,color,opacity] duration-200 hover:bg-[#181818] hover:text-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-9 sm:w-9 sm:opacity-0 sm:group-hover/message:opacity-100 sm:group-focus-within/message:opacity-100 motion-reduce:transition-none"
      >
        <Ellipsis className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Message actions"
          className={`absolute bottom-full z-30 mb-1 min-w-36 overflow-hidden rounded-xl border border-[#2f3336] bg-[#181818] p-1 shadow-xl ${
            isMine ? 'right-0' : 'left-0'
          }`}
        >
          <button
            ref={firstActionRef}
            type="button"
            role="menuitem"
            onClick={handleReply}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Reply className="h-4 w-4" aria-hidden="true" />
            Reply
          </button>

          {isMine && onRequestRevoke && (
            <button
              type="button"
              role="menuitem"
              disabled={isRevokePending}
              onClick={() => {
                closeAndRestoreFocus();
                onRequestRevoke(message);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 transition-colors duration-200 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" />
              Revoke
            </button>
          )}
        </div>
      )}
    </div>
  );
};
