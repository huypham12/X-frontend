import { apiClient } from '@/services/api.client';
import type { Conversation, Message, PaginationResponse } from '../types';
import type {
  ConversationActionResult,
  MuteConversationPayload,
  MuteConversationResult,
} from '../types/conversation-action.type';
import type {
  MessageContextData,
  MessageContextOptions,
  MessageSearchPage,
} from '../types/message-search.type';
import type { ConversationMediaPage } from '../types/conversation-media.type';
import type { CreateGroupPayload, CreatedGroupConversation } from '../types/create-group.type';

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

  searchMessages: async (
    conversationId: string,
    keyword: string,
    limit: number = 20,
    cursor?: string,
  ): Promise<MessageSearchPage> => {
    const response = await apiClient.get(`/conversations/${conversationId}/search`, {
      params: {
        q: keyword,
        limit,
        ...(cursor ? { cursor } : {}),
      },
    });
    return response.data.data;
  },

  getMessageContext: async (
    conversationId: string,
    messageId: string,
    options: MessageContextOptions = {},
  ): Promise<MessageContextData> => {
    const response = await apiClient.get(
      `/conversations/${conversationId}/messages/${messageId}/context`,
      {
        params: {
          before: options.before ?? 20,
          after: options.after ?? 20,
        },
      },
    );
    return response.data.data;
  },

  getConversationMedia: async (
    conversationId: string,
    limit: number = 20,
    cursor?: string,
  ): Promise<ConversationMediaPage> => {
    const response = await apiClient.get(`/conversations/${conversationId}/media`, {
      params: {
        limit,
        ...(cursor ? { cursor } : {}),
      },
    });
    return response.data.data;
  },

  getOrCreateDirectConversation: async (userId: string): Promise<Conversation> => {
    const response = await apiClient.post(`/conversations/direct/${userId}`);
    return response.data.data;
  },

  createGroupConversation: async (
    data: CreateGroupPayload,
  ): Promise<CreatedGroupConversation> => {
    const response = await apiClient.post('/conversations/group', data);
    return response.data.data;
  },

  markAsRead: async (conversationId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/conversations/${conversationId}/read`);
    return response.data.data;
  },

  pinConversation: async (conversationId: string): Promise<ConversationActionResult> => {
    const response = await apiClient.post(`/conversations/${conversationId}/pin`);
    return response.data.data;
  },

  unpinConversation: async (conversationId: string): Promise<ConversationActionResult> => {
    const response = await apiClient.delete(`/conversations/${conversationId}/pin`);
    return response.data.data;
  },

  muteConversation: async (
    conversationId: string,
    payload: MuteConversationPayload,
  ): Promise<MuteConversationResult> => {
    const response = await apiClient.post(`/conversations/${conversationId}/mute`, payload);
    return response.data.data;
  },

  unmuteConversation: async (
    conversationId: string,
    type: Conversation['type'],
  ): Promise<ConversationActionResult> => {
    const response = await apiClient.delete(`/conversations/${conversationId}/mute`, {
      params: { type },
    });
    return response.data.data;
  },
};
