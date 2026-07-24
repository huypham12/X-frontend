import { apiClient } from '@/services/api.client';

export const tweetService = {
  getFeeds: async (page = 1, limit = 10) => {
    const res = await apiClient.get(`/tweets?page=${page}&limit=${limit}`);
    return res.data;
  },
  createTweet: async (data: { content: string; audience?: number; type?: number; parent_id?: string; hashtags?: string[]; mentions?: string[]; medias?: string[] }) => {
    const res = await apiClient.post('/tweets', data);
    return res.data;
  },
};
