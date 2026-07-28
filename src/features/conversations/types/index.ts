import type { MediaMetadata } from '@/features/media/types/media.type';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file';
export type ConversationType = 'direct' | 'group';

export interface UserPreview {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
}

export interface MessagePreview {
  message_id?: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
}

export interface GroupMember {
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  is_muted?: boolean;
  last_seen?: string;
  user?: UserPreview;
}

export interface Reaction {
  emoji: string;
  user_id: string;
}

export type MessageReplyMediaType = 'image' | 'video' | 'audio';

export interface MessageReplyPreview {
  _id: string;
  sender_info: UserPreview | null;
  content: string;
  media_type?: MessageReplyMediaType;
  status: 'sent' | 'revoked';
}

export interface Message {
  _id: string;
  conversation_id: string;
  conversation_type: ConversationType;
  sender_id: string;
  sender_info: UserPreview | null;
  content: string;
  media_ids: string[];
  medias_info?: MediaMetadata[];
  send_at: string;
  read_by: string[];
  reply_to_message_id?: string;
  reply_to: MessageReplyPreview | null;
  status: 'sent' | 'revoked' | 'deleted';
  reactions: Reaction[];
  is_forwarded?: boolean;
  is_edited?: boolean;
  updated_at?: string;
}

export interface BaseConversation {
  _id: string;
  type: ConversationType;
  last_message_at: string;
  last_message_preview: MessagePreview;
  is_pinned: boolean;
  hidden_by?: string[];
  pinned_by?: string[];
  muted_by?: { user_id: string; until: string | null }[];
  created_at: string;
  updated_at: string;
}

export interface DirectConversation extends BaseConversation {
  type: 'direct';
  user1_id: string;
  user2_id: string;
  partner_id: string;
  partner_info?: UserPreview | null;
}

export interface GroupConversation extends BaseConversation {
  type: 'group';
  name: string;
  avatar_url?: string;
  members: GroupMember[];
  created_by: string;
  admin_only_messaging: boolean;
}

export type Conversation = DirectConversation | GroupConversation;

export interface PaginationResponse<T> {
  messages: T[];
  next_cursor: string | null;
  has_next_page: boolean;
}
