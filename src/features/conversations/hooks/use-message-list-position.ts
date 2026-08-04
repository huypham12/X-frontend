'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

interface UseMessageListPositionOptions {
  conversationId: string;
  targetMessageId: string | null;
  isLoading: boolean;
  initialPageMessageCount: number;
  latestMessageId: string | undefined;
  newestFirstMessageIds: string[];
  messageListRef: RefObject<HTMLDivElement | null>;
  isNearBottom: boolean;
  isPageActive: boolean;
  prefersReducedMotion: boolean | null;
  measurePosition: () => void;
}

export const useMessageListPosition = ({
  conversationId,
  targetMessageId,
  isLoading,
  initialPageMessageCount,
  latestMessageId,
  newestFirstMessageIds,
  messageListRef,
  isNearBottom,
  isPageActive,
  prefersReducedMotion,
  measurePosition,
}: UseMessageListPositionOptions) => {
  const hasInitiallyScrolledRef = useRef(false);
  const previousLatestMessageIdRef = useRef<string | undefined>(undefined);
  const [positionedConversationId, setPositionedConversationId] = useState<string | null>(null);

  useEffect(() => {
    hasInitiallyScrolledRef.current = false;
    previousLatestMessageIdRef.current = undefined;
  }, [conversationId]);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (
      targetMessageId ||
      isLoading ||
      initialPageMessageCount === 0 ||
      !messageList ||
      hasInitiallyScrolledRef.current
    ) {
      return;
    }

    messageList.scrollTop = messageList.scrollHeight;
    hasInitiallyScrolledRef.current = true;
    const positionFrame = window.requestAnimationFrame(() => {
      setPositionedConversationId(conversationId);
      measurePosition();
    });
    return () => window.cancelAnimationFrame(positionFrame);
  }, [
    conversationId,
    initialPageMessageCount,
    isLoading,
    measurePosition,
    messageListRef,
    targetMessageId,
  ]);

  useEffect(() => {
    const messageList = messageListRef.current;
    const previousLatestMessageId = previousLatestMessageIdRef.current;
    const previousLatestIndex = previousLatestMessageId
      ? newestFirstMessageIds.indexOf(previousLatestMessageId)
      : -1;

    if (
      messageList &&
      previousLatestIndex > 0 &&
      isNearBottom &&
      isPageActive &&
      !targetMessageId
    ) {
      messageList.scrollTo({
        top: messageList.scrollHeight,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }

    previousLatestMessageIdRef.current = latestMessageId;
  }, [
    isNearBottom,
    isPageActive,
    latestMessageId,
    messageListRef,
    newestFirstMessageIds,
    prefersReducedMotion,
    targetMessageId,
  ]);

  return positionedConversationId === conversationId;
};
