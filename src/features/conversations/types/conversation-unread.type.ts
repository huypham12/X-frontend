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

export interface ConversationReadAcknowledgement {
  success: true;
  conversation_id: string;
  unread_message_count: number;
  unread_conversation_count: number;
  total_unread_message_count: number;
  version: number;
}

export interface ConversationReadErrorAcknowledgement {
  success: false;
  error?: {
    code?: string;
    conversation_id?: string;
    message?: string;
  };
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
