'use client';

import React from 'react';
import { Message } from '../types';
import { format } from 'date-fns';
import { AudioPlayer } from '@/features/media/components/viewers/AudioPlayer';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  isHighlighted?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  isHighlighted = false,
}) => {
  const timeString = message.send_at ? format(new Date(message.send_at), 'h:mm a') : '';
  const medias = message.medias_info || [];
  const hasContent = Boolean(message.content?.trim());
  
  return (
    <div
      data-message-id={message._id}
      className={`mb-4 flex w-full rounded-xl px-1 py-1 transition-colors duration-200 motion-reduce:transition-none ${
        isMine ? 'justify-end' : 'justify-start'
      } ${isHighlighted ? 'bg-[#1d9bf0]/10 ring-1 ring-[#1d9bf0]' : ''}`}
    >
      <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {hasContent && (
          <div
            className={`px-4 py-3 rounded-2xl text-[15px] leading-tight break-words ${
              isMine
                ? 'bg-[#1d9bf0] text-white rounded-br-sm'
                : 'bg-[#2f3336] text-white rounded-bl-sm'
            }`}
          >
            {message.content}
          </div>
        )}

        {medias.length > 0 && (
          <div className={`flex max-w-full flex-col gap-2 ${hasContent ? 'mt-2' : ''}`}>
            {medias.map((media) => {
              if (media.type === 'audio') {
                return (
                  <div key={media._id} className="w-[min(450px,70vw)] max-w-full">
                    <AudioPlayer url={media.url} />
                  </div>
                );
              }

              if (media.type === 'video') {
                return (
                  <video
                    key={media._id}
                    src={media.url}
                    poster={media.thumbnail}
                    controls
                    playsInline
                    preload="metadata"
                    aria-label="Video attachment"
                    className="max-h-60 max-w-full rounded-lg border border-[#333] bg-black object-contain"
                  />
                );
              }

              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={media._id}
                  src={media.url}
                  alt="Image attachment"
                  loading="lazy"
                  className="max-h-60 max-w-full rounded-lg border border-[#333] object-contain"
                />
              );
            })}
          </div>
        )}
        <span className="text-gray-500 text-xs mt-1 px-1">
          {timeString}
        </span>
      </div>
    </div>
  );
};
