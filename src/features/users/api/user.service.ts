import { apiClient } from '@/services/api.client';

export const userService = {
  getMe: async () => {
    const res = await apiClient.get('/user/me');
    return res.data;
  },
  getProfile: async (username: string) => {
    const res = await apiClient.get(`/user/profile/${username}`);
    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await apiClient.patch('/user/me', data);
    return res.data;
  },
  followUser: async (followed_user_id: string) => {
    const res = await apiClient.post(`/user/${followed_user_id}/follow`);
    return res.data;
  },
  unfollowUser: async (followed_user_id: string) => {
    const res = await apiClient.delete(`/user/${followed_user_id}/follow`);
    return res.data;
  },
  getFollowers: async (target_user_id: string) => {
    const res = await apiClient.get(`/user/${target_user_id}/followers`);
    return res.data;
  },
  getFollowing: async (target_user_id: string) => {
    const res = await apiClient.get(`/user/${target_user_id}/following`);
    return res.data;
  }
};
