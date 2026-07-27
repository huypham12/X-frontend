'use client';

import React, { useEffect, useRef } from 'react';
import { useMessages } from '../hooks/use-messages';
import { MessageBubble } from './message-bubble';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useInView } from 'react-intersection-observer';

interface MessageListProps {
  conversationId: string;
}

export const MessageList: React.FC<MessageListProps> = ({ conversationId }) => {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversationId);
  const { user } = useAuthStore();
  const messageListRef = useRef<HTMLDivElement>(null);
  const hasInitiallyScrolledRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const previousLatestMessageIdRef = useRef<string | undefined>(undefined);
  
  const { ref: loadMoreRef, inView } = useInView();
  const initialPageMessageCount = data?.pages?.[0]?.messages?.length ?? 0;
  const latestMessageId = data?.pages?.[0]?.messages?.[0]?._id;

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    hasInitiallyScrolledRef.current = false;
    isNearBottomRef.current = true;
    previousLatestMessageIdRef.current = undefined;
  }, [conversationId]);

  // Scroll only the message container, never the page containing the composer.
  useEffect(() => {
    const messageList = messageListRef.current;
    if (!isLoading && initialPageMessageCount > 0 && messageList && !hasInitiallyScrolledRef.current) {
      messageList.scrollTop = messageList.scrollHeight;
      hasInitiallyScrolledRef.current = true;
    }
  }, [isLoading, initialPageMessageCount, conversationId]);

  // Keep the user's reading position when they are looking at older messages.
  useEffect(() => {
    const messageList = messageListRef.current;
    const previousLatestMessageId = previousLatestMessageIdRef.current;
    const hasNewMessage = Boolean(previousLatestMessageId && latestMessageId !== previousLatestMessageId);

    if (messageList && hasNewMessage && isNearBottomRef.current) {
      messageList.scrollTo({ top: messageList.scrollHeight, behavior: 'smooth' });
    }

    previousLatestMessageIdRef.current = latestMessageId;
  }, [latestMessageId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-twitter-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        Failed to load messages
      </div>
    );
  }

  // Flatten the pages and reverse them because the API returns newest first (sort -1)
  // We want to display oldest at top, newest at bottom
  const allMessages = data?.pages.flatMap((page) => page.messages).reverse() || [];

  return (
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
      {hasNextPage && (
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          {isFetchingNextPage ? (
            <div className="w-5 h-5 border-2 border-twitter-blue border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-gray-500 text-sm">Load more</span>
          )}
        </div>
      )}
      
      {allMessages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 pb-10">
          <p className="text-lg font-semibold mb-2 text-white">No messages yet</p>
          <p className="text-sm">Send a message to start the conversation.</p>
        </div>
      ) : (
        allMessages.map((message) => (
          <MessageBubble 
            key={message._id} 
            message={message} 
            isMine={message.sender_id === user?._id} 
          />
        ))
      )}
      <div className="h-1" />
    </div>
  );
};
