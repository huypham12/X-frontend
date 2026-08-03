export interface UpdateGroupPayload {
  name?: string;
  avatar_url?: string;
}

export interface TransferAdminAndLeavePayload {
  successor_user_id: string;
}

export type GroupUpdateChangeType =
  | 'info_updated'
  | 'members_added'
  | 'member_removed'
  | 'member_left'
  | 'admin_transferred'
  | 'group_created'
  | 'admin_granted'
  | 'admin_revoked';

export interface GroupUpdatedEvent {
  conversation_id: string;
  change_type: GroupUpdateChangeType;
  actor_id: string;
  affected_user_ids: string[];
}
