'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { SmilePlus } from 'lucide-react';
import type { Message } from '../types';
import type { MessageReactionEmoji } from '../types/message-action.type';
import { MessageReactionPicker } from './message-reaction-picker';

interface MessageReactionActionProps {
  message: Message;
  currentReaction?: MessageReactionEmoji;
  isPending?: boolean;
  onSelect: (emoji: MessageReactionEmoji) => void;
}

interface PickerPosition {
  left: number;
  top: number;
  ready: boolean;
}

const VIEWPORT_GUTTER = 8;
const PICKER_GAP = 8;

export const MessageReactionAction = ({
  message,
  currentReaction,
  isPending = false,
  onSelect,
}: MessageReactionActionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PickerPosition>({
    left: VIEWPORT_GUTTER,
    top: VIEWPORT_GUTTER,
    ready: false,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const closeAndRestoreFocus = useCallback(() => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const updatePickerPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const picker = pickerRef.current;
    if (!trigger || !picker) return;

    const triggerRect = trigger.getBoundingClientRect();
    const pickerRect = picker.getBoundingClientRect();
    const maxLeft = Math.max(VIEWPORT_GUTTER, window.innerWidth - pickerRect.width - VIEWPORT_GUTTER);
    const centeredLeft = triggerRect.left + triggerRect.width / 2 - pickerRect.width / 2;
    const left = Math.min(Math.max(centeredLeft, VIEWPORT_GUTTER), maxLeft);
    const topAbove = triggerRect.top - pickerRect.height - PICKER_GAP;
    const maxTop = Math.max(VIEWPORT_GUTTER, window.innerHeight - pickerRect.height - VIEWPORT_GUTTER);
    const top =
      topAbove >= VIEWPORT_GUTTER
        ? topAbove
        : Math.min(triggerRect.bottom + PICKER_GAP, maxTop);

    setPosition({ left, top, ready: true });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePickerPosition();
    const picker = pickerRef.current;
    const resizeObserver = picker ? new ResizeObserver(updatePickerPosition) : null;
    if (picker) resizeObserver?.observe(picker);

    window.addEventListener('resize', updatePickerPosition);
    window.addEventListener('scroll', updatePickerPosition, true);
    const focusFrame = window.requestAnimationFrame(() => {
      pickerRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updatePickerPosition);
      window.removeEventListener('scroll', updatePickerPosition, true);
      window.cancelAnimationFrame(focusFrame);
    };
  }, [isOpen, updatePickerPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || pickerRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAndRestoreFocus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeAndRestoreFocus, isOpen]);

  if (message.status !== 'sent') return null;

  return (
    <div ref={rootRef} className="relative shrink-0 self-center">
      <button
        ref={triggerRef}
        type="button"
        disabled={isPending}
        onClick={() => {
          setPosition((current) => ({ ...current, ready: false }));
          setIsOpen((current) => !current);
        }}
        aria-label={currentReaction ? `Change reaction ${currentReaction}` : 'React to message'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-[background-color,color,opacity] duration-200 hover:bg-[#181818] hover:text-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9 sm:opacity-0 sm:group-hover/message:opacity-100 sm:group-focus-within/message:opacity-100 motion-reduce:transition-none ${
          currentReaction ? 'text-[#1d9bf0]' : 'text-gray-400'
        }`}
      >
        <SmilePlus className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={pickerRef}
            role="dialog"
            aria-label="Message reaction picker"
            className="fixed z-[70] shadow-2xl transition-opacity duration-150 motion-reduce:transition-none"
            style={{
              left: position.left,
              top: position.top,
              opacity: position.ready ? 1 : 0,
            }}
          >
            <MessageReactionPicker
              isPending={isPending}
              onSelect={(emoji) => {
                onSelect(emoji);
                closeAndRestoreFocus();
              }}
              onEscape={closeAndRestoreFocus}
            />
          </div>,
          document.body,
        )}
    </div>
  );
};
