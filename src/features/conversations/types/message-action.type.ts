export interface MessageActionResult {
  success: boolean;
}

export interface MessageRevokedEvent {
  conversation_id: string;
  message_id: string;
}

export interface MessageDeletedForMeEvent {
  conversation_id: string;
  message_id: string;
}
