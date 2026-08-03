import type {
  NotificationActorInfo,
  NotificationListItem,
} from '../types/notification.type';

export interface NotificationPresentation {
  actorText: string | null;
  actionText: string;
  showTarget: boolean;
  unavailableTargetText: string;
}

const dedupeActors = (actors: Array<NotificationActorInfo | null>) => {
  const seen = new Set<string>();
  return actors.filter((actor): actor is NotificationActorInfo => {
    if (!actor || seen.has(actor._id)) return false;
    seen.add(actor._id);
    return true;
  });
};

export const getNotificationActors = (notification: NotificationListItem) => {
  const previewActors = dedupeActors(notification.actor_infos_preview).slice(0, 3);
  if (previewActors.length > 0) return previewActors;
  return notification.actor_info ? [notification.actor_info] : [];
};

const getActorText = (notification: NotificationListItem) => {
  const actors = getNotificationActors(notification);
  if (actors.length === 0) return 'Tài khoản không còn khả dụng';

  const names = actors.map((actor) => actor.name);
  const hiddenActorCount = Math.max(0, notification.actor_count - names.length);

  if (hiddenActorCount > 0) {
    return `${names.join(', ')} và ${hiddenActorCount} người khác`;
  }
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} và ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} và ${names.at(-1)}`;
};

const getConversationName = (notification: NotificationListItem) => {
  const target = notification.target_info;
  if (target?.target_type !== 'CONVERSATION' || !target.name) return '';
  return ` ${target.name}`;
};

export const getNotificationPresentation = (
  notification: NotificationListItem,
): NotificationPresentation => {
  const actorText = getActorText(notification);
  const conversationName = getConversationName(notification);

  switch (notification.type) {
    case 'follow':
      return {
        actorText,
        actionText: 'đã theo dõi bạn',
        showTarget: false,
        unavailableTargetText: '',
      };
    case 'followed_user_tweet':
      return {
        actorText,
        actionText: 'đã đăng một bài viết mới',
        showTarget: true,
        unavailableTargetText: 'Nội dung không còn khả dụng',
      };
    case 'like':
      return {
        actorText,
        actionText: 'đã thích bài viết của bạn',
        showTarget: true,
        unavailableTargetText: 'Nội dung không còn khả dụng',
      };
    case 'retweet':
      return {
        actorText,
        actionText: 'đã đăng lại bài viết của bạn',
        showTarget: true,
        unavailableTargetText: 'Nội dung không còn khả dụng',
      };
    case 'quote':
      return {
        actorText,
        actionText: 'đã trích dẫn bài viết của bạn',
        showTarget: true,
        unavailableTargetText: 'Nội dung không còn khả dụng',
      };
    case 'reply':
      return {
        actorText,
        actionText: 'đã trả lời bài viết của bạn',
        showTarget: true,
        unavailableTargetText: 'Nội dung không còn khả dụng',
      };
    case 'mention':
      return {
        actorText,
        actionText: 'đã nhắc đến bạn trong một bài viết',
        showTarget: true,
        unavailableTargetText: 'Nội dung không còn khả dụng',
      };
    case 'message_reply':
      return {
        actorText,
        actionText: 'đã trả lời tin nhắn của bạn',
        showTarget: true,
        unavailableTargetText: 'Tin nhắn không còn khả dụng',
      };
    case 'message_mention':
      return {
        actorText,
        actionText: 'đã nhắc đến bạn trong nhóm',
        showTarget: true,
        unavailableTargetText: 'Tin nhắn không còn khả dụng',
      };
    case 'group_add':
      return {
        actorText: null,
        actionText: `Bạn đã được thêm vào nhóm${conversationName}`,
        showTarget: true,
        unavailableTargetText: 'Nhóm không còn khả dụng',
      };
    case 'group_join':
      return {
        actorText,
        actionText: `đã tham gia nhóm${conversationName}`,
        showTarget: true,
        unavailableTargetText: 'Nhóm không còn khả dụng',
      };
    case 'group_kick':
      return {
        actorText: null,
        actionText: 'Bạn đã bị xóa khỏi nhóm',
        showTarget: true,
        unavailableTargetText: 'Bạn không còn quyền truy cập nhóm này',
      };
    case 'admin_granted':
      return {
        actorText: null,
        actionText: `Bạn đã được trao quyền quản trị nhóm${conversationName}`,
        showTarget: true,
        unavailableTargetText: 'Nhóm không còn khả dụng',
      };
    case 'admin_revoked':
      return {
        actorText: null,
        actionText: `Quyền quản trị nhóm${conversationName} của bạn đã bị thu hồi`,
        showTarget: true,
        unavailableTargetText: 'Bạn không còn quyền truy cập nhóm này',
      };
    case 'system':
      return {
        actorText: null,
        actionText: 'Bạn có một thông báo mới',
        showTarget: notification.target_info !== null,
        unavailableTargetText: 'Nội dung không còn khả dụng',
      };
    default:
      return {
        actorText: null,
        actionText: 'Bạn có một thông báo mới',
        showTarget: false,
        unavailableTargetText: 'Nội dung không còn khả dụng',
      };
  }
};

export const flattenNotifications = (
  pages: Array<{ notifications: NotificationListItem[] }> | undefined,
) => {
  const byId = new Map<string, NotificationListItem>();

  for (const page of pages ?? []) {
    for (const notification of page.notifications) {
      if (!byId.has(notification._id)) byId.set(notification._id, notification);
    }
  }

  return [...byId.values()].sort((left, right) => {
    const createdAtDifference =
      Date.parse(right.created_at) - Date.parse(left.created_at);
    if (Number.isFinite(createdAtDifference) && createdAtDifference !== 0) {
      return createdAtDifference;
    }
    return right._id.localeCompare(left._id);
  });
};
