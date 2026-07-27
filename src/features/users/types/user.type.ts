export interface Friend {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
}

export interface FriendPresenceStatus {
  user_id: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export interface FriendPresenceEvent {
  user_id: string;
}

export interface UpdateProfilePayload {
  name: string;
  username: string;
  bio?: string;
  avatar?: string;
  cover_photo?: string;
}

export interface FollowListResponse {
  followers?: Friend[];
  following?: Friend[];
}
