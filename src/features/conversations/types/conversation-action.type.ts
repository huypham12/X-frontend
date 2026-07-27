import type { ConversationType } from './index';

export type MuteDurationHours = 1 | 8 | 24;

export interface ConversationActionResult {
  success: boolean;
}

export interface MuteConversationPayload {
  type: ConversationType;
  duration_hours?: MuteDurationHours;
}

export interface MuteConversationResult extends ConversationActionResult {
  until: string | null;
}
