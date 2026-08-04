export type NotificationType =
  | 'like'
  | 'reply'
  | 'retweet'
  | 'quote'
  | 'follow'
  | 'mention'
  | 'system'
  | 'message_reply'
  | 'message_mention'
  | 'group_add'
  | 'group_join'
  | 'group_kick'
  | 'admin_granted'
  | 'admin_revoked'
  | 'followed_user_tweet';

export type NotificationTargetType = 'USER' | 'TWEET' | 'MESSAGE' | 'CONVERSATION';

export interface NotificationActorInfo {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
}

export interface NotificationUserTargetInfo extends NotificationActorInfo {
  target_type: 'USER';
}

export interface NotificationTweetTargetInfo {
  _id: string;
  target_type: 'TWEET';
  owner_id: string;
  tweet_type: 0 | 1 | 2 | 3;
  content: string;
}

export interface NotificationMessageTargetInfo {
  _id: string;
  target_type: 'MESSAGE';
  conversation_id: string;
  sender_id: string;
  content: string;
  status: 'sent' | 'revoked' | 'deleted';
}

export interface NotificationConversationTargetInfo {
  _id: string;
  target_type: 'CONVERSATION';
  conversation_type: 'direct' | 'group';
  name?: string;
  avatar_url?: string;
}

export type NotificationTargetInfo =
  | NotificationUserTargetInfo
  | NotificationTweetTargetInfo
  | NotificationMessageTargetInfo
  | NotificationConversationTargetInfo;

export interface NotificationContextBase {
  [key: string]: unknown;
}

export interface TweetNotificationContext extends NotificationContextBase {
  parent_tweet_id?: string;
  mentioned?: boolean;
}

export interface DirectedMessageNotificationContext extends NotificationContextBase {
  conversation_id?: string;
  conversation_type?: 'direct' | 'group';
  reply_to_message_id?: string;
}

export interface GroupManagementNotificationContext extends NotificationContextBase {
  system_event_type?:
    | 'group_created'
    | 'member_added'
    | 'member_left'
    | 'member_kicked'
    | 'admin_granted'
    | 'admin_revoked'
    | 'admin_transferred_and_left';
  system_message_id?: string;
  affected_user_ids?: string[];
}

export interface NotificationContextByType {
  like: NotificationContextBase;
  reply: TweetNotificationContext;
  retweet: NotificationContextBase;
  quote: TweetNotificationContext;
  follow: NotificationContextBase;
  mention: TweetNotificationContext;
  system: NotificationContextBase;
  message_reply: DirectedMessageNotificationContext;
  message_mention: DirectedMessageNotificationContext;
  group_add: GroupManagementNotificationContext;
  group_join: GroupManagementNotificationContext;
  group_kick: GroupManagementNotificationContext;
  admin_granted: GroupManagementNotificationContext;
  admin_revoked: GroupManagementNotificationContext;
  followed_user_tweet: NotificationContextBase;
}

interface NotificationSocketItemBase {
  _id: string;
  recipient_id: string;
  sender_id: string | null;
  target_id: string | null;
  is_read: boolean;
  created_at: string;
  target_type: NotificationTargetType | null;
  actor_ids_preview: string[];
  actor_count: number;
  deduplication_key?: string;
  aggregation_key?: string;
  aggregation_active: boolean;
  read_at: string | null;
  updated_at: string;
  invalidated_at: string | null;
}

interface NotificationListItemBase extends NotificationSocketItemBase {
  actor_info: NotificationActorInfo | null;
  actor_infos_preview: Array<NotificationActorInfo | null>;
  target_info: NotificationTargetInfo | null;
}

type NotificationSocketItemFor<TType extends NotificationType> = NotificationSocketItemBase & {
  type: TType;
  context: NotificationContextByType[TType];
};

export type NotificationSocketItem = {
  [TType in NotificationType]: NotificationSocketItemFor<TType>;
}[NotificationType];

type NotificationListItemFor<TType extends NotificationType> = NotificationListItemBase & {
  type: TType;
  context: NotificationContextByType[TType];
};

export type NotificationListItem = {
  [TType in NotificationType]: NotificationListItemFor<TType>;
}[NotificationType];

export interface NotificationPageData {
  notifications: NotificationListItem[];
  unreadCount: number;
  next_cursor: string | null;
  has_next_page: boolean;
}

export interface NotificationUnreadState {
  unreadCount: number;
  version: number;
  updated_at: string;
}

export interface NotificationUnreadCountEvent {
  unread_count: number;
  version: number;
  updated_at: string;
}

export interface NotificationReadStateEvent {
  action: 'mark_one' | 'read_all';
  notification_id: string | null;
  read_at: string;
  updated_count: number;
  unread_count: number;
  version: number;
}

export interface NotificationRemovedEvent {
  notification_id: string;
  aggregation_key: string | null;
  unread_count?: number;
  version?: number;
  updated_at: string;
}

export interface MarkNotificationReadResult {
  success: true;
  unreadCount: number;
  version: number;
}

export interface MarkAllNotificationsReadResult {
  updatedCount: number;
  unreadCount: number;
  version: number;
}

export interface NotificationPageRequest {
  limit?: number;
  cursor?: string;
}

export interface NotificationApiResponse<TData> {
  statusCode: number;
  message: string;
  data: TData;
}
