export interface Friend {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  username: string;
  date_of_birth?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
  cover_photo?: string;
  follower_count?: number;
  following_count?: number;
  tweet_count?: number;
  is_following?: boolean;
  is_blocked?: boolean;
  is_blocked_by_user?: boolean;
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
