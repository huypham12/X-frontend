import { apiClient } from '@/services/api.client';
import type { Conversation, Message, PaginationResponse } from '../types';
import type {
  ConversationActionResult,
  ConversationHistoryClearResult,
  ConversationOpenResult,
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
import type { GroupConversationLookupPage } from '../types/conversation-lookup.type';
import type {
  TransferAdminAndLeavePayload,
  UpdateGroupPayload,
} from '../types/group-action.type';
import type { GroupMemberDetails } from '../types/group-member.type';
import type {
  MessageActionResult,
  MessageReactionDetail,
  MessageReactionEmoji,
  MessageReactionState,
} from '../types/message-action.type';
import type {
  ConversationReadRequest,
  ConversationReadResult,
  ConversationUnreadSummary,
} from '../types/conversation-unread.type';

interface ApiResponse<TData> {
  statusCode: number;
  message: string;
  data: TData;
}

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

  getOrCreateDirectConversation: async (userId: string): Promise<ConversationOpenResult> => {
    const response = await apiClient.post(`/conversations/direct/${userId}`);
    return response.data.data;
  },

  searchGroupConversations: async (
    keyword: string,
    limit: number = 10,
    cursor?: string,
  ): Promise<GroupConversationLookupPage> => {
    const response = await apiClient.get('/conversations/groups/search', {
      params: {
        q: keyword,
        limit,
        ...(cursor ? { cursor } : {}),
      },
    });
    return response.data.data;
  },

  createGroupConversation: async (
    data: CreateGroupPayload,
  ): Promise<CreatedGroupConversation> => {
    const response = await apiClient.post('/conversations/group', data);
    return response.data.data;
  },

  hideConversation: async (conversationId: string): Promise<ConversationActionResult> => {
    const response = await apiClient.delete(`/conversations/${conversationId}`);
    return response.data.data;
  },

  clearConversationHistory: async (
    conversationId: string,
  ): Promise<ConversationHistoryClearResult> => {
    const response = await apiClient.delete(`/conversations/${conversationId}/history`);
    return response.data.data;
  },

  unhideConversation: async (conversationId: string): Promise<ConversationOpenResult> => {
    const response = await apiClient.post(`/conversations/${conversationId}/unhide`);
    return response.data.data;
  },

  getUnreadSummary: async (): Promise<ConversationUnreadSummary> => {
    const response = await apiClient.get<ApiResponse<ConversationUnreadSummary>>(
      '/conversations/unread-summary',
    );
    return response.data.data;
  },

  markAsRead: async (
    conversationId: string,
    request: ConversationReadRequest = {},
  ): Promise<ConversationReadResult> => {
    const response = await apiClient.post<ApiResponse<ConversationReadResult>>(
      `/conversations/${conversationId}/read`,
      request,
    );
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

  updateGroupInfo: async (
    conversationId: string,
    payload: UpdateGroupPayload,
  ): Promise<ConversationActionResult> => {
    const response = await apiClient.patch(`/conversations/${conversationId}`, payload);
    return response.data.data;
  },

  getGroupMembers: async (conversationId: string): Promise<GroupMemberDetails[]> => {
    const response = await apiClient.get(`/conversations/${conversationId}/members`);
    return response.data.data;
  },

  addGroupMembers: async (
    conversationId: string,
    memberIds: string[],
  ): Promise<ConversationActionResult> => {
    const response = await apiClient.post(`/conversations/${conversationId}/members`, {
      members: memberIds,
    });
    return response.data.data;
  },

  removeGroupMember: async (
    conversationId: string,
    memberId: string,
  ): Promise<ConversationActionResult> => {
    const response = await apiClient.delete(
      `/conversations/${conversationId}/members/${memberId}`,
    );
    return response.data.data;
  },

  leaveGroup: async (conversationId: string): Promise<ConversationActionResult> => {
    const response = await apiClient.delete(`/conversations/${conversationId}/leave`);
    return response.data.data;
  },

  transferAdminAndLeave: async (
    conversationId: string,
    payload: TransferAdminAndLeavePayload,
  ): Promise<ConversationActionResult> => {
    const response = await apiClient.post(
      `/conversations/${conversationId}/transfer-admin-and-leave`,
      payload,
    );
    return response.data.data;
  },

  revokeMessage: async (messageId: string): Promise<MessageActionResult> => {
    const response = await apiClient.post(`/conversations/messages/${messageId}/revoke`);
    return response.data.data;
  },

  deleteMessage: async (messageId: string): Promise<MessageActionResult> => {
    const response = await apiClient.delete(`/conversations/messages/${messageId}`);
    return response.data.data;
  },

  reactMessage: async (
    messageId: string,
    emoji: MessageReactionEmoji,
  ): Promise<MessageReactionState> => {
    const response = await apiClient.post(`/conversations/messages/${messageId}/react`, {
      emoji,
    });
    return response.data.data;
  },

  unreactMessage: async (messageId: string): Promise<MessageReactionState> => {
    const response = await apiClient.delete(`/conversations/messages/${messageId}/react`);
    return response.data.data;
  },

  getMessageReactions: async (messageId: string): Promise<MessageReactionDetail[]> => {
    const response = await apiClient.get(`/conversations/messages/${messageId}/reactions`);
    return response.data.data;
  },
};
