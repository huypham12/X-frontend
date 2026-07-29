import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { conversationsApi } from '../api/conversations.api';
import { CONVERSATIONS_QUERY_KEY } from './use-conversations';
import { upsertConversationCache } from '../utils/conversation-cache';
import { markConversationReopened } from '../utils/conversation-reopen-state';

interface ApiErrorBody {
  message?: string;
}

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message || 'Could not restore this conversation.';
  }

  return error instanceof Error ? error.message : 'Could not restore this conversation.';
};

export const useReopenConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      conversationsApi.unhideConversation(conversationId),
    onSuccess: (result) => {
      markConversationReopened(result.conversation._id, result.reopened_at);
      upsertConversationCache(queryClient, result.conversation);
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
