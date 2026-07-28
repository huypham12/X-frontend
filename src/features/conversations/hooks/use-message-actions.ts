'use client';

import axios from 'axios';
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { conversationsApi } from '../api/conversations.api';
import type { Message, PaginationResponse } from '../types';
import type { MessageContextData } from '../types/message-search.type';
import type { MessageRevokedEvent } from '../types/message-action.type';
import { MESSAGES_QUERY_KEY } from './use-messages';
import { CONVERSATIONS_QUERY_KEY } from './use-conversations';

interface ApiErrorBody {
  message?: string;
}

const toRevokedTombstone = (message: Message): Message => ({
  ...message,
  content: '',
  media_ids: [],
  medias_info: [],
  reactions: [],
  reply_to_message_id: undefined,
  reply_to: null,
  status: 'revoked',
});

const patchReplyPreview = (message: Message, revokedMessageId: string): Message => {
  if (message._id === revokedMessageId) return toRevokedTombstone(message);
  if (message.reply_to_message_id !== revokedMessageId || !message.reply_to) return message;

  return {
    ...message,
    reply_to: {
      ...message.reply_to,
      content: '',
      media_type: undefined,
      status: 'revoked',
    },
  };
};

const patchInfiniteMessages = (
  data: InfiniteData<PaginationResponse<Message>> | undefined,
  revokedMessageId: string,
  removeRevokedMessage: boolean,
) => {
  if (!data) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages
        .filter((message) => !removeRevokedMessage || message._id !== revokedMessageId)
        .map((message) => patchReplyPreview(message, revokedMessageId)),
    })),
  };
};

export const syncRevokedMessageCaches = (
  queryClient: QueryClient,
  event: MessageRevokedEvent,
) => {
  queryClient.setQueryData<InfiniteData<PaginationResponse<Message>>>(
    MESSAGES_QUERY_KEY(event.conversation_id),
    (data) => patchInfiniteMessages(data, event.message_id, false),
  );
  queryClient.setQueriesData<MessageContextData>(
    { queryKey: ['conversation-message-context', event.conversation_id] },
    (data) =>
      data
        ? {
            ...data,
            messages: data.messages.map((message) =>
              patchReplyPreview(message, event.message_id),
            ),
          }
        : data,
  );
  queryClient.setQueriesData<InfiniteData<PaginationResponse<Message>>>(
    { queryKey: ['conversation-message-search', event.conversation_id] },
    (data) => patchInfiniteMessages(data, event.message_id, true),
  );
  queryClient.setQueryData<InfiniteData<PaginationResponse<Message>>>(
    ['conversation-media', event.conversation_id],
    (data) => patchInfiniteMessages(data, event.message_id, true),
  );
};

export const refreshRevokedMessageQueries = async (
  queryClient: QueryClient,
  conversationId: string,
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEY(conversationId) }),
    queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY }),
    queryClient.invalidateQueries({
      queryKey: ['conversation-message-search', conversationId],
      refetchType: 'active',
    }),
    queryClient.invalidateQueries({
      queryKey: ['conversation-media', conversationId],
      refetchType: 'active',
    }),
  ]);
};

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message || 'Could not revoke this message.';
  }

  return error instanceof Error ? error.message : 'Could not revoke this message.';
};

export const useMessageActions = (conversationId: string) => {
  const queryClient = useQueryClient();
  const revokeMutation = useMutation({
    mutationFn: (messageId: string) => conversationsApi.revokeMessage(messageId),
    onSuccess: async (_result, messageId) => {
      syncRevokedMessageCaches(queryClient, {
        conversation_id: conversationId,
        message_id: messageId,
      });
      await refreshRevokedMessageQueries(queryClient, conversationId);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const revokeMessage = async (messageId: string) => {
    try {
      await revokeMutation.mutateAsync(messageId);
      return true;
    } catch {
      return false;
    }
  };

  return {
    isRevokePending: revokeMutation.isPending,
    pendingMessageId: revokeMutation.variables,
    revokeMessage,
  };
};
