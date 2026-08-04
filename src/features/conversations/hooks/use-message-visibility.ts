'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

const NEAR_BOTTOM_DISTANCE_PX = 120;

interface UseMessageVisibilityOptions {
  conversationId: string;
  newestFirstMessageIds: string[];
  renderedMessageIds: string[];
  readTargetMessageId: string | null;
  isViewingContext: boolean;
}

interface UseMessageVisibilityResult {
  messageListRef: RefObject<HTMLDivElement | null>;
  isPageActive: boolean;
  isNearBottom: boolean;
  isReadTargetVisible: boolean;
  newMessageCount: number;
  firstNewMessageId: string | null;
  handleScroll: () => void;
  consumeNewMessagesThrough: (messageId: string) => void;
  measurePosition: () => void;
}

const isDocumentActive = () =>
  document.visibilityState === 'visible' && document.hasFocus();

export const useMessageVisibility = ({
  conversationId,
  newestFirstMessageIds,
  renderedMessageIds,
  readTargetMessageId,
  isViewingContext,
}: UseMessageVisibilityOptions): UseMessageVisibilityResult => {
  const messageListRef = useRef<HTMLDivElement>(null);
  const previousNewestMessageIdRef = useRef<string | undefined>(undefined);
  const pendingNewMessageIdsRef = useRef<string[]>([]);
  const [isPageActive, setIsPageActive] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [visibleReadTargetMessageId, setVisibleReadTargetMessageId] = useState<string | null>(null);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [firstNewMessageId, setFirstNewMessageId] = useState<string | null>(null);
  const renderedMessageSignature = renderedMessageIds.join(':');

  const measurePosition = useCallback(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    const distanceFromBottom =
      messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight;
    setIsNearBottom(distanceFromBottom < NEAR_BOTTOM_DISTANCE_PX);
  }, []);

  const handleScroll = useCallback(() => {
    measurePosition();
  }, [measurePosition]);

  const clearNewMessages = useCallback(() => {
    pendingNewMessageIdsRef.current = [];
    setNewMessageCount(0);
    setFirstNewMessageId(null);
  }, []);

  const consumeNewMessagesThrough = useCallback((messageId: string) => {
    const acknowledgedIndex = pendingNewMessageIdsRef.current.indexOf(messageId);
    if (acknowledgedIndex < 0) return;

    const remainingIds = pendingNewMessageIdsRef.current.slice(acknowledgedIndex + 1);
    pendingNewMessageIdsRef.current = remainingIds;
    setNewMessageCount(remainingIds.length);
    setFirstNewMessageId(remainingIds[0] ?? null);
  }, []);

  useEffect(() => {
    previousNewestMessageIdRef.current = undefined;
    pendingNewMessageIdsRef.current = [];
    const resetFrame = window.requestAnimationFrame(() => {
      setIsNearBottom(true);
      setVisibleReadTargetMessageId(null);
      setNewMessageCount(0);
      setFirstNewMessageId(null);
    });
    return () => window.cancelAnimationFrame(resetFrame);
  }, [conversationId]);

  useEffect(() => {
    const updateActivity = () => {
      const nextIsPageActive = isDocumentActive();
      setIsPageActive(nextIsPageActive);
      if (nextIsPageActive) {
        window.requestAnimationFrame(measurePosition);
      }
    };

    updateActivity();
    document.addEventListener('visibilitychange', updateActivity);
    window.addEventListener('focus', updateActivity);
    window.addEventListener('blur', updateActivity);

    return () => {
      document.removeEventListener('visibilitychange', updateActivity);
      window.removeEventListener('focus', updateActivity);
      window.removeEventListener('blur', updateActivity);
    };
  }, [measurePosition]);

  useEffect(() => {
    const newestMessageId = newestFirstMessageIds[0];
    const previousNewestMessageId = previousNewestMessageIdRef.current;
    previousNewestMessageIdRef.current = newestMessageId;

    if (!newestMessageId || !previousNewestMessageId || newestMessageId === previousNewestMessageId) {
      return;
    }

    const previousNewestIndex = newestFirstMessageIds.indexOf(previousNewestMessageId);
    if (previousNewestIndex <= 0) return;

    const arrivedMessageIds = newestFirstMessageIds.slice(0, previousNewestIndex).reverse();
    if (isPageActive && isNearBottom && !isViewingContext) return;

    const pendingIds = pendingNewMessageIdsRef.current;
    const existingIds = new Set(pendingIds);
    arrivedMessageIds.forEach((messageId) => {
      if (!existingIds.has(messageId)) pendingIds.push(messageId);
    });
    setNewMessageCount(pendingIds.length);
    setFirstNewMessageId(pendingIds[0] ?? null);
  }, [isNearBottom, isPageActive, isViewingContext, newestFirstMessageIds]);

  useEffect(() => {
    if (
      !isPageActive ||
      !isNearBottom ||
      isViewingContext ||
      visibleReadTargetMessageId !== readTargetMessageId
    ) {
      return;
    }
    const clearFrame = window.requestAnimationFrame(clearNewMessages);
    return () => window.cancelAnimationFrame(clearFrame);
  }, [
    clearNewMessages,
    isNearBottom,
    isPageActive,
    isViewingContext,
    readTargetMessageId,
    visibleReadTargetMessageId,
  ]);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList || !readTargetMessageId) {
      const clearFrame = window.requestAnimationFrame(() => setVisibleReadTargetMessageId(null));
      return () => window.cancelAnimationFrame(clearFrame);
    }

    const target = messageList.querySelector<HTMLElement>(
      `[data-message-id="${readTargetMessageId}"]`,
    );
    if (!target) {
      const clearFrame = window.requestAnimationFrame(() => setVisibleReadTargetMessageId(null));
      return () => window.cancelAnimationFrame(clearFrame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisibleReadTargetMessageId(entry.isIntersecting ? readTargetMessageId : null),
      { root: messageList, threshold: 0 },
    );
    observer.observe(target);

    return () => observer.disconnect();
  }, [readTargetMessageId, renderedMessageSignature]);

  return {
    messageListRef,
    isPageActive,
    isNearBottom,
    isReadTargetVisible: visibleReadTargetMessageId === readTargetMessageId,
    newMessageCount,
    firstNewMessageId,
    handleScroll,
    consumeNewMessagesThrough,
    measurePosition,
  };
};
