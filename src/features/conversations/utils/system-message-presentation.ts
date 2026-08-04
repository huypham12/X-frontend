import type {
  ConversationSystemEventType,
  Message,
  MessagePreview,
} from '../types';

const SYSTEM_EVENT_FALLBACKS = {
  group_created: 'The group was created.',
  member_added: 'A member was added to the group.',
  member_left: 'A member left the group.',
  member_kicked: 'A member was removed from the group.',
  admin_granted: 'Group admin access was granted.',
  admin_revoked: 'Group admin access was revoked.',
  admin_transferred_and_left:
    'Group admin access was transferred and the previous admin left.',
} satisfies Record<ConversationSystemEventType, string>;

const GENERIC_SYSTEM_MESSAGE = 'Group activity updated.';

export type SystemMessage = Message & { kind: 'system' };

export const isSystemMessage = (message: Message): message is SystemMessage =>
  message.kind === 'system';

export const getSystemMessageText = (
  message: {
    content: Message['content'];
    system_event_type?: Message['system_event_type'] | null;
  },
) => {
  const backendContent = message.content?.trim();
  if (backendContent) return backendContent;

  return message.system_event_type
    ? SYSTEM_EVENT_FALLBACKS[message.system_event_type] ?? GENERIC_SYSTEM_MESSAGE
    : GENERIC_SYSTEM_MESSAGE;
};

export const getSystemPreviewText = (
  preview: Pick<MessagePreview, 'content' | 'kind' | 'system_event_type'>,
) => {
  if (preview.kind === 'system') return getSystemMessageText(preview);
  return preview.content?.trim() || 'Started a conversation';
};
