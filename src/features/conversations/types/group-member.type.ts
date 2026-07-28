export type GroupMemberRole = 'admin' | 'member';

export interface GroupMemberUser {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
}

export interface GroupMemberDetails {
  role: GroupMemberRole;
  joined_at: string;
  user: GroupMemberUser;
}
