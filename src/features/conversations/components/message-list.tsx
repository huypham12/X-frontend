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
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const { ref: loadMoreRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Scroll to bottom when initially loaded
  useEffect(() => {
    if (!isLoading && data?.pages?.[0]?.messages?.length) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [isLoading]);

  // When a new message comes in, scroll to bottom
  useEffect(() => {
    // Only scroll if we are already near the bottom, otherwise don't disrupt the user
    // For simplicity, we just scroll to bottom if new messages are added
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.pages?.[0]?.messages?.[0]?._id]);

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
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col">
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
      <div ref={bottomRef} className="h-1" />
    </div>
  );
};
