'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  captureAuthSession,
  isAuthSessionCurrent,
  useAuthStore,
} from '@/features/auth/stores/auth.store';
import { conversationsApi } from '../api/conversations.api';
import { CONVERSATIONS_QUERY_KEY } from './use-conversations';
import { useConversationDetailsStore } from '../stores/conversation-details.store';
import type { Conversation } from '../types';
import type { MuteDurationHours } from '../types/conversation-action.type';
import { useMessageComposerStore } from '../stores/message-composer.store';
import {
  clearConversationHistoryCaches,
  sortConversations,
} from '../utils/conversation-cache';
import { conversationKeys } from '../constants/conversation-query-keys';

interface ApiErrorBody {
  message?: string;
}

interface ConversationsMutationContext {
  previousConversations?: Conversation[];
}

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
};

export const getActiveConversationMute = (
  conversation: Conversation,
  currentUserId: string | undefined,
  now = Date.now(),
) => {
  if (!currentUserId) return undefined;

  return conversation.muted_by?.find((mute) => {
    if (mute.user_id !== currentUserId) return false;
    return mute.until === null || new Date(mute.until).getTime() > now;
  });
};

export const useConversationActions = (conversation: Conversation) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?._id);
  const session = captureAuthSession();
  const closeDetails = useConversationDetailsStore((state) => state.closeDetails);
  const activeMute = getActiveConversationMute(conversation, currentUserId);

  const updateConversationCache = (
    updater: (currentConversation: Conversation) => Conversation,
    shouldSort = false,
  ) => {
    queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (currentConversations) => {
      if (!currentConversations) return currentConversations;

      const updatedConversations = currentConversations.map((currentConversation) =>
        currentConversation._id === conversation._id
          ? updater(currentConversation)
          : currentConversation,
      );

      return shouldSort ? sortConversations(updatedConversations) : updatedConversations;
    });
  };

  const restoreConversationCache = (context: ConversationsMutationContext | undefined) => {
    if (context?.previousConversations) {
      queryClient.setQueryData(CONVERSATIONS_QUERY_KEY, context.previousConversations);
    }
  };

  const pinMutation = useMutation({
    mutationFn: (shouldPin: boolean) =>
      shouldPin
        ? conversationsApi.pinConversation(conversation._id)
        : conversationsApi.unpinConversation(conversation._id),
    onMutate: async (shouldPin): Promise<ConversationsMutationContext> => {
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      const previousConversations = queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY);

      updateConversationCache(
        (currentConversation) => ({ ...currentConversation, is_pinned: shouldPin }),
        true,
      );

      return { previousConversations };
    },
    onError: (error, shouldPin, context) => {
      if (!isAuthSessionCurrent(session)) return;
      restoreConversationCache(context);
      toast.error(
        getErrorMessage(error, shouldPin ? 'Could not pin conversation.' : 'Could not unpin conversation.'),
      );
    },
    onSettled: () =>
      isAuthSessionCurrent(session)
        ? queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
        : undefined,
  });

  const muteMutation = useMutation({
    mutationFn: (durationHours?: MuteDurationHours) =>
      conversationsApi.muteConversation(conversation._id, {
        type: conversation.type,
        ...(durationHours ? { duration_hours: durationHours } : {}),
      }),
    onMutate: async (durationHours): Promise<ConversationsMutationContext> => {
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      const previousConversations = queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY);

      if (currentUserId) {
        const until = durationHours
          ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
          : null;

        updateConversationCache((currentConversation) => ({
          ...currentConversation,
          muted_by: [
            ...(currentConversation.muted_by?.filter((mute) => mute.user_id !== currentUserId) || []),
            { user_id: currentUserId, until },
          ],
        }));
      }

      return { previousConversations };
    },
    onError: (error, _durationHours, context) => {
      if (!isAuthSessionCurrent(session)) return;
      restoreConversationCache(context);
      toast.error(getErrorMessage(error, 'Could not mute conversation.'));
    },
    onSettled: () =>
      isAuthSessionCurrent(session)
        ? queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
        : undefined,
  });

  const unmuteMutation = useMutation({
    mutationFn: () => conversationsApi.unmuteConversation(conversation._id, conversation.type),
    onMutate: async (): Promise<ConversationsMutationContext> => {
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      const previousConversations = queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY);

      if (currentUserId) {
        updateConversationCache((currentConversation) => ({
          ...currentConversation,
          muted_by: currentConversation.muted_by?.filter((mute) => mute.user_id !== currentUserId),
        }));
      }

      return { previousConversations };
    },
    onError: (error, _variables, context) => {
      if (!isAuthSessionCurrent(session)) return;
      restoreConversationCache(context);
      toast.error(getErrorMessage(error, 'Could not unmute conversation.'));
    },
    onSettled: () =>
      isAuthSessionCurrent(session)
        ? queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
        : undefined,
  });

  const hideMutation = useMutation({
    mutationFn: () => conversationsApi.hideConversation(conversation._id),
    onSuccess: async () => {
      if (!isAuthSessionCurrent(session)) return;
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (currentConversations) =>
        currentConversations?.filter(
          (currentConversation) => currentConversation._id !== conversation._id,
        ),
      );
      closeDetails();
      router.replace('/messages');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: conversationKeys.unreadSummary() }),
      ]);
    },
    onError: (error) => {
      if (!isAuthSessionCurrent(session)) return;
      toast.error(getErrorMessage(error, 'Could not hide conversation from your inbox.'));
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: () => conversationsApi.clearConversationHistory(conversation._id),
    onSuccess: async () => {
      if (!isAuthSessionCurrent(session)) return;
      clearConversationHistoryCaches(queryClient, conversation._id);
      const composer = useMessageComposerStore.getState();
      if (composer.conversationId === conversation._id) composer.clearReply();
      closeDetails();
      router.replace('/messages');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: conversationKeys.unreadSummary() }),
      ]);
    },
    onError: (error) => {
      if (!isAuthSessionCurrent(session)) return;
      toast.error(getErrorMessage(error, 'Could not delete this chat history.'));
    },
  });

  const muteConversation = async (durationHours?: MuteDurationHours) => {
    if (!currentUserId) {
      toast.error('Your account information is not available yet.');
      return false;
    }

    try {
      await muteMutation.mutateAsync(durationHours);
      return true;
    } catch {
      return false;
    }
  };

  const hideConversation = async () => {
    try {
      await hideMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  const clearConversationHistory = async () => {
    try {
      await clearHistoryMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  return {
    isMuted: Boolean(activeMute),
    mutedUntil: activeMute?.until ?? null,
    isPinPending: pinMutation.isPending,
    isMutePending: muteMutation.isPending || unmuteMutation.isPending,
    isHidePending: hideMutation.isPending,
    isClearHistoryPending: clearHistoryMutation.isPending,
    togglePin: () => pinMutation.mutate(!conversation.is_pinned),
    muteConversation,
    unmuteConversation: () => unmuteMutation.mutate(),
    hideConversation,
    clearConversationHistory,
  };
};
