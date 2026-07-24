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
  }
};
