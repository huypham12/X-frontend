import type { NotificationListItem } from '../types/notification.type';

export type NotificationDestination =
  | { kind: 'route'; href: string }
  | {
      kind: 'message';
      href: string;
      conversationId: string;
      messageId: string;
    };

const getTweetDestination = (
  notification: NotificationListItem,
): NotificationDestination | null => {
  const target = notification.target_info;
  if (target?.target_type !== 'TWEET') return null;

  if (notification.type === 'reply' || notification.type === 'mention') {
    const parentTweetId = notification.context.parent_tweet_id;
    if (typeof parentTweetId === 'string' && parentTweetId.length > 0) {
      return {
        kind: 'route',
        href: `/tweet/${encodeURIComponent(parentTweetId)}?focus=${encodeURIComponent(target._id)}`,
      };
    }
  }

  return { kind: 'route', href: `/tweet/${encodeURIComponent(target._id)}` };
};

const getConversationDestination = (
  notification: NotificationListItem,
): NotificationDestination | null => {
  const target = notification.target_info;
  if (target?.target_type !== 'CONVERSATION') return null;
  return {
    kind: 'route',
    href: `/messages/${encodeURIComponent(target._id)}`,
  };
};

const getMessageDestination = (
  notification: NotificationListItem,
): NotificationDestination | null => {
  const target = notification.target_info;
  if (target?.target_type !== 'MESSAGE' || target.status !== 'sent') return null;

  const contextConversationId = notification.context.conversation_id;
  if (
    contextConversationId !== undefined &&
    contextConversationId !== target.conversation_id
  ) {
    return null;
  }

  return {
    kind: 'message',
    href: `/messages/${encodeURIComponent(target.conversation_id)}`,
    conversationId: target.conversation_id,
    messageId: target._id,
  };
};

const getGenericTargetDestination = (
  notification: NotificationListItem,
): NotificationDestination | null => {
  const target = notification.target_info;
  if (!target) return null;

  switch (target.target_type) {
    case 'USER':
      return {
        kind: 'route',
        href: `/profile/${encodeURIComponent(target.username)}`,
      };
    case 'TWEET':
      return { kind: 'route', href: `/tweet/${encodeURIComponent(target._id)}` };
    case 'MESSAGE':
      return getMessageDestination(notification);
    case 'CONVERSATION':
      return getConversationDestination(notification);
  }
};

export const getNotificationDestination = (
  notification: NotificationListItem,
): NotificationDestination | null => {
  switch (notification.type) {
    case 'follow':
      return notification.actor_info
        ? {
            kind: 'route',
            href: `/profile/${encodeURIComponent(notification.actor_info.username)}`,
          }
        : null;
    case 'like':
    case 'reply':
    case 'retweet':
    case 'quote':
    case 'mention':
    case 'followed_user_tweet':
      return getTweetDestination(notification);
    case 'message_reply':
    case 'message_mention':
      return getMessageDestination(notification);
    case 'group_add':
    case 'group_join':
    case 'admin_granted':
    case 'admin_revoked':
      return getConversationDestination(notification);
    case 'group_kick':
      return null;
    case 'system':
      return getGenericTargetDestination(notification);
    default:
      return null;
  }
};
