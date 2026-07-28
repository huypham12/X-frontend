import type { Message } from '../types';
import { MessageBubble } from './message-bubble';
import { MessageSenderAvatar } from './message-sender-avatar';
import { MessageActionsMenu } from './message-actions-menu';
import type { MessageReactionEmoji } from '../types/message-action.type';
import { getCurrentUserReaction } from './message-reaction-summary';
import { MessageReactionAction } from './message-reaction-action';

interface MessageRowProps {
  message: Message;
  isMine: boolean;
  isFirstInCluster: boolean;
  isLastInCluster: boolean;
  isHighlighted?: boolean;
  currentUserId?: string;
  isRevokePending?: boolean;
  isDeletePending?: boolean;
  isReactionPending?: boolean;
  onRequestRevoke?: (message: Message) => void;
  onRequestDelete?: (message: Message) => void;
  onSelectReaction?: (
    message: Message,
    emoji: MessageReactionEmoji,
    currentReaction?: MessageReactionEmoji,
  ) => Promise<boolean>;
}

export const MessageRow = ({
  message,
  isMine,
  isFirstInCluster,
  isLastInCluster,
  isHighlighted = false,
  currentUserId,
  isRevokePending = false,
  isDeletePending = false,
  isReactionPending = false,
  onRequestRevoke,
  onRequestDelete,
  onSelectReaction,
}: MessageRowProps) => {
  const showGroupSenderName =
    !isMine && message.conversation_type === 'group' && isFirstInCluster;
  const senderName = message.sender_info?.name.trim() || 'Unknown sender';
  const currentReaction = getCurrentUserReaction(message.reactions, currentUserId);

  return (
    <div
      data-message-id={message._id}
      className={`flex w-full rounded-xl px-1 py-0.5 transition-colors duration-200 motion-reduce:transition-none ${
        isMine ? 'justify-end' : 'justify-start'
      } ${isLastInCluster ? 'mb-3' : ''} ${
        isHighlighted ? 'bg-[#1d9bf0]/10 ring-1 ring-[#1d9bf0]' : ''
      }`}
    >
      {!isMine && (
        <div className="mr-2 flex w-8 shrink-0 self-end justify-center">
          {isLastInCluster ? (
            <MessageSenderAvatar messageId={message._id} sender={message.sender_info} />
          ) : (
            <span className="h-8 w-8" aria-hidden="true" />
          )}
        </div>
      )}

      <div
        className={`group/message flex min-w-0 items-end gap-1 sm:max-w-[78%] ${
          isMine ? 'max-w-full flex-row-reverse' : 'max-w-[calc(100%-2.5rem)] flex-row'
        }`}
      >
        <div className={`flex min-w-0 max-w-full flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          {showGroupSenderName && (
            <span className="mb-1 max-w-full truncate px-1 text-xs font-medium text-gray-400">
              {senderName}
            </span>
          )}
          <MessageBubble
            message={message}
            isMine={isMine}
            isFirstInCluster={isFirstInCluster}
            isLastInCluster={isLastInCluster}
            currentUserId={currentUserId}
            isReactionPending={isReactionPending}
            onRemoveReaction={
              currentReaction && onSelectReaction
                ? () => onSelectReaction(message, currentReaction, currentReaction)
                : undefined
            }
          />
        </div>
        {onSelectReaction && (
          <MessageReactionAction
            message={message}
            currentReaction={currentReaction}
            isPending={isReactionPending}
            onSelect={(emoji) => onSelectReaction(message, emoji, currentReaction)}
          />
        )}
        <MessageActionsMenu
          message={message}
          isMine={isMine}
          isRevokePending={isRevokePending}
          isDeletePending={isDeletePending}
          onRequestRevoke={onRequestRevoke}
          onRequestDelete={onRequestDelete}
        />
      </div>
    </div>
  );
};
