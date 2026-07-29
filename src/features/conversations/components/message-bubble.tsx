'use client';

import React, { useState } from 'react';
import type { Message } from '../types';
import { format } from 'date-fns';
import { MessageReplyPreview } from './message-reply-preview';
import { useConversationDetailsStore } from '../stores/conversation-details.store';
import type { MessageReactionEmoji } from '../types/message-action.type';
import { MessageReactionSummary } from './message-reaction-summary';
import { MessageReactionsDialog } from './message-reactions-dialog';
import { MessageAttachments } from './message-attachments';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  isFirstInCluster: boolean;
  isLastInCluster: boolean;
  currentUserId?: string;
  isReactionPending?: boolean;
  onRemoveReaction?: () => Promise<boolean>;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  isFirstInCluster,
  isLastInCluster,
  currentUserId,
  isReactionPending = false,
  onRemoveReaction,
}) => {
  const [selectedReaction, setSelectedReaction] = useState<MessageReactionEmoji>();
  const [isReactionsDialogOpen, setIsReactionsDialogOpen] = useState(false);
  const focusMessage = useConversationDetailsStore((state) => state.focusMessage);
  const timeString = message.send_at ? format(new Date(message.send_at), 'h:mm a') : '';
  const medias = message.medias_info || [];
  const hasContent = Boolean(message.content?.trim());
  const hasReply = Boolean(message.reply_to_message_id);
  const hasReactions = message.reactions.length > 0;
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
      <div
        className={`relative flex max-w-full flex-col ${
          isMine ? 'items-end' : 'items-start'
        } ${hasReactions ? 'mb-3' : ''}`}
      >
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

        <MessageAttachments medias={medias} hasLeadingContent={hasContent || hasReply} />
        <MessageReactionSummary
          reactions={message.reactions}
          currentUserId={currentUserId}
          onOpen={(emoji) => {
            setSelectedReaction(emoji);
            setIsReactionsDialogOpen(true);
          }}
        />
      </div>
      {isLastInCluster && <span className="mt-1 px-1 text-xs text-gray-500">{timeString}</span>}
      <MessageReactionsDialog
        messageId={message._id}
        open={isReactionsDialogOpen}
        selectedEmoji={selectedReaction}
        currentUserId={currentUserId}
        isRemovingCurrentUserReaction={isReactionPending}
        onRemoveCurrentUserReaction={onRemoveReaction}
        onOpenChange={setIsReactionsDialogOpen}
      />
    </div>
  );
};
