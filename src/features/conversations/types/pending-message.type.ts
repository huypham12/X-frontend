import type { ConversationType } from './index';

export interface SendMessageDraft {
  conversation_id: string;
  conversation_type: ConversationType;
  content: string;
  media_ids?: string[];
  reply_to_message_id?: string;
  mention_user_ids?: string[];
}

export interface SendMessagePayload extends SendMessageDraft {
  client_message_id: string;
}

export type PendingSendStatus =
  | 'sending'
  | 'not_sent'
  | 'failed_to_confirm'
  | 'failed'
  | 'conflict';

export interface PendingMessageOperation {
  clientMessageId: string;
  payload: SendMessagePayload;
  status: PendingSendStatus;
  errorMessage?: string;
}

export type SendMessageResult =
  | {
      status: 'committed';
      clientMessageId: string;
      messageId: string;
    }
  | {
      status: Exclude<PendingSendStatus, 'sending'>;
      clientMessageId: string;
      errorMessage: string;
    };
