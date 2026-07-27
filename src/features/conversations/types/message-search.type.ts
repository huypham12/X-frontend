import type { Message, PaginationResponse } from './index';

export type MessageSearchPage = PaginationResponse<Message>;

export interface MessageContextData {
  messages: Message[];
  target_message_id: string;
  older_cursor: string | null;
  newer_cursor: string | null;
}

export interface MessageContextOptions {
  before?: number;
  after?: number;
}
