'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMessages } from '../hooks/use-messages';
import { MessageRow } from './message-row';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useInView } from 'react-intersection-observer';
import { ArrowDown, RotateCcw } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { useConversationDetailsStore } from '../stores/conversation-details.store';
import { useMessageContext } from '../hooks/use-message-context';
import { useMessageActions } from '../hooks/use-message-actions';
import { RevokeMessageDialog } from './revoke-message-dialog';
import { DeleteMessageDialog } from './delete-message-dialog';
import type { Message } from '../types';

interface MessageListProps {
  conversationId: string;
}

const MessageContextSkeleton = () => (
  <div
    className="flex flex-1 flex-col justify-center gap-4 py-6"
    aria-label="Loading message context"
  >
    <div className="flex justify-start">
      <div className="h-14 w-2/3 animate-pulse rounded-2xl rounded-bl-sm bg-[#181818] motion-reduce:animate-none" />
    </div>
    <div className="flex justify-end">
      <div className="h-20 w-3/4 animate-pulse rounded-2xl rounded-br-sm bg-[#181818] motion-reduce:animate-none" />
    </div>
    <div className="flex justify-start">
      <div className="h-12 w-1/2 animate-pulse rounded-2xl rounded-bl-sm bg-[#181818] motion-reduce:animate-none" />
    </div>
  </div>
);

export const MessageList: React.FC<MessageListProps> = ({ conversationId }) => {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId);
  const { user } = useAuthStore();
  const targetConversationId = useConversationDetailsStore((state) => state.targetConversationId);
  const storedTargetMessageId = useConversationDetailsStore((state) => state.targetMessageId);
  const clearFocusedMessage = useConversationDetailsStore((state) => state.clearFocusedMessage);
  const targetMessageId = targetConversationId === conversationId ? storedTargetMessageId : null;
  const {
    data: contextData,
    isLoading: isContextLoading,
    isError: isContextError,
    refetch: refetchContext,
  } = useMessageContext(conversationId, targetMessageId);
  const prefersReducedMotion = useReducedMotion();
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [messageToRevoke, setMessageToRevoke] = useState<Message | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const {
    isRevokePending,
    revokePendingMessageId,
    revokeMessage,
    isDeletePending,
    deletePendingMessageId,
    deleteMessage,
    isReactionPending,
    reactionPendingMessageId,
    toggleReaction,
  } = useMessageActions(conversationId);
  const messageListRef = useRef<HTMLDivElement>(null);
  const hasInitiallyScrolledRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const previousLatestMessageIdRef = useRef<string | undefined>(undefined);
  const wasViewingContextRef = useRef(false);
  
  const { ref: loadMoreRef, inView } = useInView();
  const initialPageMessageCount = data?.pages?.[0]?.messages?.length ?? 0;
  const latestMessageId = data?.pages?.[0]?.messages?.[0]?._id;

  useEffect(() => {
    if (!messageToDelete || isDeletePending) return;

    const timelineMessage = data?.pages
      .flatMap((page) => page.messages)
      .find((message) => message._id === messageToDelete._id);
    const contextMessage = contextData?.messages.find(
      (message) => message._id === messageToDelete._id,
    );
    const currentMessage = timelineMessage ?? contextMessage;

    if (!currentMessage || currentMessage.status !== 'sent') {
      setMessageToDelete(null);
    }
  }, [contextData, data, isDeletePending, messageToDelete]);

  useEffect(() => {
    if (!targetMessageId && inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [targetMessageId, inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (targetConversationId && targetConversationId !== conversationId) {
      clearFocusedMessage();
    }
  }, [clearFocusedMessage, conversationId, targetConversationId]);

  useEffect(() => {
    hasInitiallyScrolledRef.current = false;
    isNearBottomRef.current = true;
    previousLatestMessageIdRef.current = undefined;
  }, [conversationId]);

  // Scroll only the message container, never the page containing the composer.
  useEffect(() => {
    const messageList = messageListRef.current;
    if (
      !targetMessageId &&
      !isLoading &&
      initialPageMessageCount > 0 &&
      messageList &&
      !hasInitiallyScrolledRef.current
    ) {
      messageList.scrollTop = messageList.scrollHeight;
      hasInitiallyScrolledRef.current = true;
    }
  }, [isLoading, initialPageMessageCount, conversationId, targetMessageId]);

  // Keep the user's reading position when they are looking at older messages.
  useEffect(() => {
    const messageList = messageListRef.current;
    const previousLatestMessageId = previousLatestMessageIdRef.current;
    const hasNewMessage = Boolean(previousLatestMessageId && latestMessageId !== previousLatestMessageId);

    if (messageList && hasNewMessage && isNearBottomRef.current && !targetMessageId) {
      messageList.scrollTo({ top: messageList.scrollHeight, behavior: 'smooth' });
    }

    previousLatestMessageIdRef.current = latestMessageId;
  }, [latestMessageId, targetMessageId]);

  useEffect(() => {
    if (!targetMessageId || !contextData) return;

    let highlightTimeout: number | undefined;
    const scrollFrame = window.requestAnimationFrame(() => {
      setHighlightedMessageId(targetMessageId);
      const targetElement = messageListRef.current?.querySelector<HTMLElement>(
        `[data-message-id="${targetMessageId}"]`,
      );
      targetElement?.scrollIntoView({
        block: 'center',
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
      highlightTimeout = window.setTimeout(() => setHighlightedMessageId(null), 1800);
    });

    return () => {
      window.cancelAnimationFrame(scrollFrame);
      if (highlightTimeout) window.clearTimeout(highlightTimeout);
    };
  }, [contextData, prefersReducedMotion, targetMessageId]);

  useEffect(() => {
    const wasViewingContext = wasViewingContextRef.current;
    wasViewingContextRef.current = Boolean(targetMessageId);

    if (!wasViewingContext || targetMessageId) return;

    const scrollFrame = window.requestAnimationFrame(() => {
      const messageList = messageListRef.current;
      if (messageList) messageList.scrollTop = messageList.scrollHeight;
    });

    return () => window.cancelAnimationFrame(scrollFrame);
  }, [targetMessageId]);

  if (!targetMessageId && isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-twitter-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!targetMessageId && isError) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        Failed to load messages
      </div>
    );
  }

  // Flatten the pages and reverse them because the API returns newest first (sort -1)
  // We want to display oldest at top, newest at bottom
  const allMessages = data?.pages.flatMap((page) => page.messages).reverse() || [];
  const displayedMessages = targetMessageId ? contextData?.messages || [] : allMessages;

  return (
    <>
      <div
      ref={messageListRef}
      onScroll={(event) => {
        const messageList = event.currentTarget;
        const distanceFromBottom =
          messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight;
        isNearBottomRef.current = distanceFromBottom < 120;
      }}
      className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4"
    >
      {targetMessageId && (
        <div className="sticky top-0 z-[1] mb-4 flex justify-center bg-black/90 py-2 backdrop-blur-sm">
          <button
            type="button"
            onClick={clearFocusedMessage}
            className="flex items-center gap-2 rounded-full border border-[#536471] bg-black px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
            Back to latest messages
          </button>
        </div>
      )}

      {targetMessageId && isContextLoading ? (
        <MessageContextSkeleton />
      ) : targetMessageId && isContextError ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-sm text-gray-400">This message could not be loaded.</p>
          <button
            type="button"
            onClick={() => {
              void refetchContext();
            }}
            className="mt-4 flex items-center gap-2 rounded-full border border-[#536471] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : (
        <>
          {!targetMessageId && hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isFetchingNextPage ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-twitter-blue border-t-transparent" />
              ) : (
                <span className="text-sm text-gray-500">Load more</span>
              )}
            </div>
          )}

          {displayedMessages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center pb-10 text-gray-500">
              <p className="mb-2 text-lg font-semibold text-white">No messages yet</p>
              <p className="text-sm">Send a message to start the conversation.</p>
            </div>
          ) : (
            displayedMessages.map((message, index) => {
              const previousMessage = displayedMessages[index - 1];
              const nextMessage = displayedMessages[index + 1];

              return (
                <MessageRow
                  key={message._id}
                  message={message}
                  isMine={message.sender_id === user?._id}
                  isFirstInCluster={previousMessage?.sender_id !== message.sender_id}
                  isLastInCluster={nextMessage?.sender_id !== message.sender_id}
                  isHighlighted={message._id === highlightedMessageId}
                  currentUserId={user?._id}
                  isRevokePending={
                    isRevokePending && revokePendingMessageId === message._id
                  }
                  isDeletePending={
                    isDeletePending && deletePendingMessageId === message._id
                  }
                  isReactionPending={
                    isReactionPending && reactionPendingMessageId === message._id
                  }
                  onRequestRevoke={setMessageToRevoke}
                  onRequestDelete={setMessageToDelete}
                  onSelectReaction={(selectedMessage, emoji, currentReaction) =>
                    toggleReaction(selectedMessage._id, emoji, currentReaction)
                  }
                />
              );
            })
          )}
          <div className="h-1" />
        </>
      )}
      </div>
      <RevokeMessageDialog
        message={messageToRevoke}
        isPending={isRevokePending}
        onOpenChange={(open) => {
          if (!open) setMessageToRevoke(null);
        }}
        onConfirm={revokeMessage}
      />
      <DeleteMessageDialog
        message={messageToDelete}
        isPending={isDeletePending}
        onOpenChange={(open) => {
          if (!open) setMessageToDelete(null);
        }}
        onConfirm={deleteMessage}
      />
    </>
  );
};
