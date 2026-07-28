export interface UpdateGroupPayload {
  name?: string;
  avatar_url?: string;
}

export type GroupUpdateChangeType =
  | 'info_updated'
  | 'members_added'
  | 'member_removed'
  | 'member_left';

export interface GroupUpdatedEvent {
  conversation_id: string;
  change_type: GroupUpdateChangeType;
  actor_id: string;
  affected_user_ids: string[];
}
