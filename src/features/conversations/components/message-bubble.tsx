'use client';

import React from 'react';
import { Message } from '../types';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMine }) => {
  const timeString = message.send_at ? format(new Date(message.send_at), 'h:mm a') : '';
  const medias = message.medias_info || [];
  
  return (
    <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div 
          className={`
            px-4 py-3 rounded-2xl text-[15px] leading-tight break-words
            ${isMine 
              ? 'bg-twitter-blue text-white rounded-br-sm' 
              : 'bg-[#2f3336] text-white rounded-bl-sm'}
          `}
        >
          {message.content && <div>{message.content}</div>}
          
          {medias.length > 0 && (
            <div className={`flex flex-wrap gap-2 ${message.content ? 'mt-2' : ''}`}>
              {medias.map((media: any) => (
                <div key={media._id} className="relative rounded-lg overflow-hidden max-w-full">
                  {media.type === 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={media.url} 
                      alt="Attachment" 
                      className="max-h-60 object-contain rounded-lg border border-[#333]"
                    />
                  ) : (
                    <video 
                      src={media.url} 
                      controls 
                      className="max-h-60 object-contain rounded-lg border border-[#333]"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <span className="text-gray-500 text-xs mt-1 px-1">
          {timeString}
        </span>
      </div>
    </div>
  );
};
