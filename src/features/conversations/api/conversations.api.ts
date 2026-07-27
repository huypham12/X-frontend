import { apiClient } from '@/services/api.client';
import { Conversation, Message, PaginationResponse } from '../types';

export const conversationsApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get('/conversations');
    return response.data.data;
  },

  getMessages: async (conversationId: string, limit: number = 20, cursor?: string): Promise<PaginationResponse<Message>> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (cursor) {
      params.append('cursor', cursor);
    }
    
    const response = await apiClient.get(`/conversations/${conversationId}/messages?${params.toString()}`);
    return response.data.data;
  },

  getOrCreateDirectConversation: async (userId: string): Promise<Conversation> => {
    const response = await apiClient.post(`/conversations/direct/${userId}`);
    return response.data.data;
  },

  createGroupConversation: async (data: { name: string; members: string[]; avatar_url?: string }): Promise<Conversation> => {
    const response = await apiClient.post('/conversations/group', data);
    return response.data.data;
  },

  markAsRead: async (conversationId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/conversations/${conversationId}/read`);
    return response.data.data;
  },
  
  sendMessage: async (conversationId: string, content: string, media_ids: string[] = []): Promise<void> => {
    // Actually sending message can be via socket or REST. We will rely on socket for real-time.
  }
};
