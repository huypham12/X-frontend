import { apiClient } from '@/services/api.client';

export const tweetService = {
  getNewFeeds: async (limit = 10, cursor?: string) => {
    const res = await apiClient.get('/tweets', { params: { limit, cursor } });
    return res.data.data;
  },

  getForYouFeeds: async (limit = 10, cursor?: string) => {
    const res = await apiClient.get('/tweets/for-you', { params: { limit, cursor } });
    return res.data.data;
  },

  getUserTweets: async (username: string, limit = 10, cursor?: string) => {
    const res = await apiClient.get(`/user/${username}/tweets`, { params: { limit, cursor } });
    return res.data.data;
  },

  getUserReplies: async (username: string, limit = 10, cursor?: string) => {
    const res = await apiClient.get(`/user/${username}/replies`, { params: { limit, cursor } });
    return res.data.data;
  },

  getUserLikes: async (username: string, limit = 10, cursor?: string) => {
    const res = await apiClient.get(`/user/${username}/likes`, { params: { limit, cursor } });
    return res.data.data;
  },

  getUserMedia: async (username: string, limit = 10, cursor?: string) => {
    const res = await apiClient.get(`/user/${username}/media`, { params: { limit, cursor } });
    return res.data.data;
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
    return res.data.data;
  },

  likeTweet: async (tweet_id: string) => {
    const res = await apiClient.post(`/tweets/${tweet_id}/like`);
    return res.data.data;
  },

  unretweet: async (tweet_id: string) => {
    const res = await apiClient.delete(`/tweets/${tweet_id}/retweet`);
    return res.data.data;
  },

  unlikeTweet: async (tweet_id: string) => {
    const res = await apiClient.delete(`/tweets/${tweet_id}/like`);
    return res.data.data;
  },

  bookmarkTweet: async (tweet_id: string) => {
    const res = await apiClient.post(`/tweets/${tweet_id}/bookmark`);
    return res.data.data;
  },

  unbookmarkTweet: async (tweet_id: string) => {
    const res = await apiClient.delete(`/tweets/${tweet_id}/bookmark`);
    return res.data.data;
  },

  deleteTweet: async (tweet_id: string) => {
    const res = await apiClient.delete(`/tweets/${tweet_id}`);
    return res.data.data;
  },

  updateTweet: async (tweet_id: string, data: { content?: string; audience?: number; hashtags?: string[]; mentions?: string[]; medias?: string[] }) => {
    const res = await apiClient.patch(`/tweets/${tweet_id}`, data);
    return res.data.data;
  },

  getBookmarks: async (limit = 10, cursor?: string) => {
    const res = await apiClient.get('/tweets/bookmarks', { params: { limit, cursor } });
    return res.data.data;
  },

  getTweet: async (tweet_id: string) => {
    const res = await apiClient.get(`/tweets/${tweet_id}`);
    return res.data.data;
  },

  getTweetChildren: async (tweet_id: string, limit = 10, cursor?: string) => {
    const res = await apiClient.get(`/tweets/${tweet_id}/children`, { params: { limit, cursor } });
    return res.data.data;
  }
};
