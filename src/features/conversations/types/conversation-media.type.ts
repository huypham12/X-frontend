import type { MediaMetadata, MediaType } from '@/features/media/types/media.type';
import type { Message, PaginationResponse } from './index';

export type ConversationMediaTab = MediaType;
export type ConversationMediaPage = PaginationResponse<Message>;

export interface SharedConversationMedia extends MediaMetadata {
  messageId: string;
  senderId: string;
  sentAt: string;
}
