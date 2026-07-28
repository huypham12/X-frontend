'use client';

import React from 'react';
import { Message } from '../types';
import { format } from 'date-fns';
import { AudioPlayer } from '@/features/media/components/viewers/AudioPlayer';
import { MessageReplyPreview } from './message-reply-preview';
import { useConversationDetailsStore } from '../stores/conversation-details.store';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  isFirstInCluster: boolean;
  isLastInCluster: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  isFirstInCluster,
  isLastInCluster,
}) => {
  const focusMessage = useConversationDetailsStore((state) => state.focusMessage);
  const timeString = message.send_at ? format(new Date(message.send_at), 'h:mm a') : '';
  const medias = message.medias_info || [];
  const hasContent = Boolean(message.content?.trim());
  const hasReply = Boolean(message.reply_to_message_id);
  const isRevoked = message.status === 'revoked';

  if (isRevoked) {
    return (
      <div className={`flex min-w-0 max-w-full flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div className="max-w-full rounded-2xl border border-[#2f3336] px-4 py-3 text-sm italic text-gray-500">
          Message was revoked
        </div>
        {isLastInCluster && <span className="mt-1 px-1 text-xs text-gray-500">{timeString}</span>}
      </div>
    );
  }
  
  return (
    <div className={`flex min-w-0 max-w-full flex-col ${isMine ? 'items-end' : 'items-start'}`}>
      {(hasContent || hasReply) && (
        <div
          className={`max-w-full break-words px-4 py-3 text-[15px] leading-snug text-white ${
            isMine ? 'bg-[#1d9bf0]' : 'bg-[#2f3336]'
          } ${isFirstInCluster ? 'rounded-t-2xl' : 'rounded-t-lg'} ${
            isLastInCluster ? 'rounded-b-2xl' : 'rounded-b-lg'
          } ${isMine && isLastInCluster ? 'rounded-br-sm' : ''} ${
            !isMine && isLastInCluster ? 'rounded-bl-sm' : ''
          }`}
        >
          {message.reply_to_message_id && (
            <div className={hasContent ? 'mb-2' : ''}>
              <MessageReplyPreview
                reply={message.reply_to}
                targetMessageId={message.reply_to_message_id}
                variant="bubble"
                onOpenTarget={(messageId) => focusMessage(message.conversation_id, messageId)}
              />
            </div>
          )}
          {hasContent && message.content}
        </div>
      )}

      {medias.length > 0 && (
        <div className={`flex max-w-full flex-col gap-2 ${hasContent || hasReply ? 'mt-2' : ''}`}>
          {medias.map((media) => {
            if (media.type === 'audio') {
              return (
                <div key={media._id} className="w-[min(450px,calc(100vw-5rem))] max-w-full">
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
                  className="max-h-60 max-w-full rounded-xl border border-[#333] bg-black object-contain"
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
                className="max-h-60 max-w-full rounded-xl border border-[#333] object-contain"
              />
            );
          })}
        </div>
      )}
      {isLastInCluster && <span className="mt-1 px-1 text-xs text-gray-500">{timeString}</span>}
    </div>
  );
};
