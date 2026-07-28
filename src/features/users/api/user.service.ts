import { apiClient } from '@/services/api.client';
import type {
  FollowListResponse,
  Friend,
  UpdateProfilePayload,
  UserProfile,
} from '../types/user.type';

export const userService = {
  getMe: async () => {
    const res = await apiClient.get('/user/me');
    return res.data.data;
  },
  getProfile: async (username: string): Promise<UserProfile[]> => {
    const res = await apiClient.get(`/user/profile/${username}`);
    return res.data.data;
  },
  updateProfile: async (data: UpdateProfilePayload) => {
    const res = await apiClient.patch('/user/me', data);
    return res.data.data;
  },
  followUser: async (followed_user_id: string) => {
    const res = await apiClient.post(`/user/${followed_user_id}/follow`);
    return res.data.data;
  },
  unfollowUser: async (followed_user_id: string) => {
    const res = await apiClient.delete(`/user/${followed_user_id}/follow`);
    return res.data.data;
  },
  blockUser: async (blocked_user_id: string): Promise<void> => {
    await apiClient.post(`/user/${blocked_user_id}/block`);
  },
  unblockUser: async (blocked_user_id: string): Promise<void> => {
    await apiClient.delete(`/user/${blocked_user_id}/block`);
  },
  getFollowers: async (target_user_id: string): Promise<FollowListResponse> => {
    const res = await apiClient.get(`/user/${target_user_id}/followers`);
    return res.data.data;
  },
  getFollowing: async (target_user_id: string): Promise<FollowListResponse> => {
    const res = await apiClient.get(`/user/${target_user_id}/following`);
    return res.data.data;
  },
  getSuggestedUsers: async () => {
    const res = await apiClient.get('/user/suggested');
    return res.data.data;
  },
  getFriends: async (): Promise<Friend[]> => {
    const res = await apiClient.get('/user/friends');
    return res.data.data;
  }
};
