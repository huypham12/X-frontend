'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

interface UseMessageFocusPresentationOptions {
  messageListRef: RefObject<HTMLDivElement | null>;
  targetMessageId: string | null;
  hasContextData: boolean;
  prefersReducedMotion: boolean | null;
}

export const useMessageFocusPresentation = ({
  messageListRef,
  targetMessageId,
  hasContextData,
  prefersReducedMotion,
}: UseMessageFocusPresentationOptions) => {
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const wasViewingContextRef = useRef(false);

  const presentMessage = useCallback(
    (messageId: string, moveFocus: boolean) => {
      setHighlightedMessageId(messageId);
      const messageElement = messageListRef.current?.querySelector<HTMLElement>(
        `[data-message-id="${messageId}"]`,
      );
      messageElement?.scrollIntoView({
        block: 'center',
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
      if (moveFocus) messageElement?.focus({ preventScroll: true });
    },
    [messageListRef, prefersReducedMotion],
  );

  useEffect(() => {
    if (!targetMessageId || !hasContextData) return;
    const scrollFrame = window.requestAnimationFrame(() => {
      presentMessage(targetMessageId, false);
    });
    return () => window.cancelAnimationFrame(scrollFrame);
  }, [hasContextData, presentMessage, targetMessageId]);

  useEffect(() => {
    if (!highlightedMessageId) return;

    const clearHighlight = () => setHighlightedMessageId(null);
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      const highlightedMessage = messageListRef.current?.querySelector<HTMLElement>(
        `[data-message-id="${highlightedMessageId}"]`,
      );
      if (!highlightedMessage?.contains(event.target)) clearHighlight();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') clearHighlight();
    };
    const highlightTimeout = window.setTimeout(clearHighlight, 1800);

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(highlightTimeout);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [highlightedMessageId, messageListRef]);

  useEffect(() => {
    const wasViewingContext = wasViewingContextRef.current;
    wasViewingContextRef.current = Boolean(targetMessageId);
    if (!wasViewingContext || targetMessageId) return;

    const scrollFrame = window.requestAnimationFrame(() => {
      const messageList = messageListRef.current;
      if (messageList) messageList.scrollTop = messageList.scrollHeight;
    });
    return () => window.cancelAnimationFrame(scrollFrame);
  }, [messageListRef, targetMessageId]);

  return { highlightedMessageId, presentMessage };
};
