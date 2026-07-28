export interface MessageActionResult {
  success: boolean;
}

export interface MessageRevokedEvent {
  conversation_id: string;
  message_id: string;
}
