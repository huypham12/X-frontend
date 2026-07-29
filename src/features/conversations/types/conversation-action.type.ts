import type { Conversation, ConversationType } from './index';

export type MuteDurationHours = 1 | 8 | 24;

export interface ConversationActionResult {
  success: boolean;
}

export interface ConversationHistoryClearResult extends ConversationActionResult {
  cleared_at: string;
}

export interface ConversationOpenResult extends ConversationActionResult {
  reopened_at: string;
  conversation: Conversation;
}

export interface ConversationHistoryClearedEvent {
  conversation_id: string;
  cleared_at: string;
}

export interface MuteConversationPayload {
  type: ConversationType;
  duration_hours?: MuteDurationHours;
}

export interface MuteConversationResult extends ConversationActionResult {
  until: string | null;
}
