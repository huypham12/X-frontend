import type { UserPreview } from './index';

export interface MessageActionResult {
  success: boolean;
}

export type MessageReactionEmoji = string;

export interface MessageReactionItem {
  emoji: MessageReactionEmoji;
  user_id: string;
}

export interface MessageReactionSummaryItem {
  emoji: MessageReactionEmoji;
  count: number;
}

export interface MessageReactionState {
  reactions: MessageReactionItem[];
  summary: MessageReactionSummaryItem[];
}

export interface MessageReactionDetail {
  emoji: MessageReactionEmoji;
  user: UserPreview;
}

export interface MessageReactionUpdatedEvent extends MessageReactionState {
  conversation_id: string;
  message_id: string;
}

export interface MessageRevokedEvent {
  conversation_id: string;
  message_id: string;
}

export interface MessageDeletedForMeEvent {
  conversation_id: string;
  message_id: string;
}
