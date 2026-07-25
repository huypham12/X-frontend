import { apiClient } from '@/services/api.client';

export const tweetService = {
  getNewFeeds: async (limit = 10, cursor?: string) => {
    const res = await apiClient.get('/tweets', { params: { limit, cursor } });
    return res.data;
  },

  getForYouFeeds: async (limit = 10, cursor?: string) => {
    const res = await apiClient.get('/tweets/for-you', { params: { limit, cursor } });
    return res.data;
  },

  getUserTweets: async (username: string, limit = 10, cursor?: string) => {
    const res = await apiClient.get(`/user/${username}/tweets`, { params: { limit, cursor } });
    return res.data;
  },

  createTweet: async (data: {
    type: number;
    audience: number;
    content: string;
    parent_id: string | null;
    hashtags: string[];
    mentions: string[];
    medias: string[];
  }) => {
    const res = await apiClient.post('/tweets', data);
    return res.data;
  },

  likeTweet: async (tweet_id: string) => {
    const res = await apiClient.post(`/tweets/${tweet_id}/like`);
    return res.data;
  },

  unlikeTweet: async (tweet_id: string) => {
    const res = await apiClient.delete(`/tweets/${tweet_id}/like`);
    return res.data;
  },

  bookmarkTweet: async (tweet_id: string) => {
    const res = await apiClient.post(`/tweets/${tweet_id}/bookmark`);
    return res.data;
  },

  unbookmarkTweet: async (tweet_id: string) => {
    const res = await apiClient.delete(`/tweets/${tweet_id}/bookmark`);
    return res.data;
  },

  deleteTweet: async (tweet_id: string) => {
    const res = await apiClient.delete(`/tweets/${tweet_id}`);
    return res.data;
  },

  getBookmarks: async (limit = 10, cursor?: string) => {
    const res = await apiClient.get('/tweets/bookmarks', { params: { limit, cursor } });
    return res.data;
  },

  getTweet: async (tweet_id: string) => {
    const res = await apiClient.get(`/tweets/${tweet_id}`);
    return res.data;
  },

  getTweetChildren: async (tweet_id: string, limit = 10, cursor?: string) => {
    const res = await apiClient.get(`/tweets/${tweet_id}/children`, { params: { limit, cursor } });
    return res.data;
  }
};
