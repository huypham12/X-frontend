import { apiClient } from '@/services/api.client';

export const searchService = {
  searchUsers: async (q: string, limit = 20, cursor?: string) => {
    const res = await apiClient.get('/search/users', { params: { q, limit, cursor } });
    return res.data.data;
  },
  searchTweets: async (q: string, type = 'all', limit = 20, cursor?: string) => {
    const res = await apiClient.get('/search/tweets', { params: { q, type, limit, cursor } });
    return res.data.data;
  },
  getSearchHistory: async () => {
    const res = await apiClient.get('/search/history');
    return res.data.data;
  },
  deleteSearchHistory: async () => {
    const res = await apiClient.delete('/search/history');
    return res.data.data;
  }
};
