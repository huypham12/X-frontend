export interface ConversationUnreadSummary {
  unread_conversation_count: number;
  total_unread_message_count: number;
  version: number;
  updated_at: string;
}

export interface ConversationReadRequest {
  message_id?: string;
}

export interface ConversationReadResult {
  success: true;
  conversation_id: string;
  last_read_message_id: string | null;
  last_read_at: string | null;
  unread_message_count: number;
  unread_conversation_count: number;
  total_unread_message_count: number;
  version: number;
}

export interface ConversationReadStateEvent {
  conversation_id: string;
  last_read_message_id: string | null;
  last_read_at: string | null;
  unread_message_count: number;
  unread_conversation_count: number;
  total_unread_message_count: number;
  version: number;
  updated_at: string;
}
