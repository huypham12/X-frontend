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
import type {
  MessageDeletedForMeEvent,
  MessageReactionEmoji,
  MessageReactionState,
  MessageReactionUpdatedEvent,
  MessageRevokedEvent,
} from '../types/message-action.type';
import { MESSAGES_QUERY_KEY } from './use-messages';
import { CONVERSATIONS_QUERY_KEY } from './use-conversations';
import { MESSAGE_CONTEXT_QUERY_KEY } from './use-message-context';
import { useConversationDetailsStore } from '../stores/conversation-details.store';
import { useMessageComposerStore } from '../stores/message-composer.store';

interface ApiErrorBody {
  message?: string;
}

interface ReactionMutationVariables {
  messageId: string;
  emoji: MessageReactionEmoji;
  currentReaction?: MessageReactionEmoji;
}

export const MESSAGE_REACTION_DETAILS_QUERY_KEY = (messageId: string) =>
  ['message-reaction-details', messageId] as const;

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

const removeMessageFromInfiniteData = (
  data: InfiniteData<PaginationResponse<Message>> | undefined,
  messageId: string,
) => {
  if (!data) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.filter((message) => message._id !== messageId),
    })),
  };
};

export const syncDeletedMessageCaches = (
  queryClient: QueryClient,
  event: MessageDeletedForMeEvent,
) => {
  queryClient.setQueryData<InfiniteData<PaginationResponse<Message>>>(
    MESSAGES_QUERY_KEY(event.conversation_id),
    (data) => removeMessageFromInfiniteData(data, event.message_id),
  );
  queryClient.setQueriesData<MessageContextData>(
    { queryKey: ['conversation-message-context', event.conversation_id] },
    (data) =>
      data
        ? {
            ...data,
            messages: data.messages.filter((message) => message._id !== event.message_id),
          }
        : data,
  );
  queryClient.setQueriesData<InfiniteData<PaginationResponse<Message>>>(
    { queryKey: ['conversation-message-search', event.conversation_id] },
    (data) => removeMessageFromInfiniteData(data, event.message_id),
  );
  queryClient.setQueryData<InfiniteData<PaginationResponse<Message>>>(
    ['conversation-media', event.conversation_id],
    (data) => removeMessageFromInfiniteData(data, event.message_id),
  );
};

export const clearDeletedMessageSelections = (event: MessageDeletedForMeEvent) => {
  useMessageComposerStore.getState().clearReplyToMessage(event.message_id);

  const detailsState = useConversationDetailsStore.getState();
  if (
    detailsState.targetConversationId === event.conversation_id &&
    detailsState.targetMessageId === event.message_id
  ) {
    detailsState.clearFocusedMessage();
  }
};

export const refreshDeletedMessageQueries = async (
  queryClient: QueryClient,
  event: MessageDeletedForMeEvent,
) => {
  queryClient.removeQueries({
    queryKey: MESSAGE_CONTEXT_QUERY_KEY(event.conversation_id, event.message_id),
    exact: true,
  });

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEY(event.conversation_id) }),
    queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY }),
    queryClient.invalidateQueries({
      queryKey: ['conversation-message-context', event.conversation_id],
      refetchType: 'active',
    }),
    queryClient.invalidateQueries({
      queryKey: ['conversation-message-search', event.conversation_id],
      refetchType: 'active',
    }),
    queryClient.invalidateQueries({
      queryKey: ['conversation-media', event.conversation_id],
      refetchType: 'active',
    }),
  ]);
};

const patchMessageReactions = (
  message: Message,
  messageId: string,
  state: MessageReactionState,
): Message =>
  message._id === messageId ? { ...message, reactions: state.reactions } : message;

const patchReactionInfiniteData = (
  data: InfiniteData<PaginationResponse<Message>> | undefined,
  event: MessageReactionUpdatedEvent,
) => {
  if (!data) return data;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      messages: page.messages.map((message) =>
        patchMessageReactions(message, event.message_id, event),
      ),
    })),
  };
};

export const syncReactionUpdatedCaches = (
  queryClient: QueryClient,
  event: MessageReactionUpdatedEvent,
) => {
  queryClient.setQueryData<InfiniteData<PaginationResponse<Message>>>(
    MESSAGES_QUERY_KEY(event.conversation_id),
    (data) => patchReactionInfiniteData(data, event),
  );
  queryClient.setQueriesData<MessageContextData>(
    { queryKey: ['conversation-message-context', event.conversation_id] },
    (data) =>
      data
        ? {
            ...data,
            messages: data.messages.map((message) =>
              patchMessageReactions(message, event.message_id, event),
            ),
          }
        : data,
  );
  queryClient.setQueriesData<InfiniteData<PaginationResponse<Message>>>(
    { queryKey: ['conversation-message-search', event.conversation_id] },
    (data) => patchReactionInfiniteData(data, event),
  );
  queryClient.setQueryData<InfiniteData<PaginationResponse<Message>>>(
    ['conversation-media', event.conversation_id],
    (data) => patchReactionInfiniteData(data, event),
  );
};

export const refreshReactionQueries = async (
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEY(conversationId) }),
    queryClient.invalidateQueries({
      queryKey: ['conversation-message-context', conversationId],
      refetchType: 'active',
    }),
    queryClient.invalidateQueries({
      queryKey: ['conversation-message-search', conversationId],
      refetchType: 'active',
    }),
    queryClient.invalidateQueries({
      queryKey: ['conversation-media', conversationId],
      refetchType: 'active',
    }),
    queryClient.invalidateQueries({
      queryKey: MESSAGE_REACTION_DETAILS_QUERY_KEY(messageId),
      refetchType: 'active',
    }),
  ]);
};

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
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
      toast.error(getErrorMessage(error, 'Could not revoke this message.'));
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => conversationsApi.deleteMessage(messageId),
    onSuccess: async (_result, messageId) => {
      const event: MessageDeletedForMeEvent = {
        conversation_id: conversationId,
        message_id: messageId,
      };
      syncDeletedMessageCaches(queryClient, event);
      clearDeletedMessageSelections(event);
      await refreshDeletedMessageQueries(queryClient, event);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not delete this message.'));
    },
  });
  const reactionMutation = useMutation({
    mutationFn: ({ messageId, emoji, currentReaction }: ReactionMutationVariables) =>
      currentReaction === emoji
        ? conversationsApi.unreactMessage(messageId)
        : conversationsApi.reactMessage(messageId, emoji),
    onSuccess: async (state, { messageId }) => {
      syncReactionUpdatedCaches(queryClient, {
        conversation_id: conversationId,
        message_id: messageId,
        ...state,
      });
      await queryClient.invalidateQueries({
        queryKey: MESSAGE_REACTION_DETAILS_QUERY_KEY(messageId),
        refetchType: 'active',
      });
    },
    onError: async (error, { messageId }) => {
      toast.error(getErrorMessage(error, 'Could not update this reaction.'));
      await refreshReactionQueries(queryClient, conversationId, messageId);
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

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteMutation.mutateAsync(messageId);
      return true;
    } catch {
      return false;
    }
  };

  const toggleReaction = async (
    messageId: string,
    emoji: MessageReactionEmoji,
    currentReaction?: MessageReactionEmoji,
  ) => {
    if (reactionMutation.isPending) return false;

    try {
      await reactionMutation.mutateAsync({ messageId, emoji, currentReaction });
      return true;
    } catch {
      return false;
    }
  };

  return {
    isRevokePending: revokeMutation.isPending,
    revokePendingMessageId: revokeMutation.variables,
    revokeMessage,
    isDeletePending: deleteMutation.isPending,
    deletePendingMessageId: deleteMutation.variables,
    deleteMessage,
    isReactionPending: reactionMutation.isPending,
    reactionPendingMessageId: reactionMutation.variables?.messageId,
    toggleReaction,
  };
};
