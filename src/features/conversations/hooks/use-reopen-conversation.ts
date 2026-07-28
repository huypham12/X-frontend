import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { conversationsApi } from '../api/conversations.api';
import { CONVERSATIONS_QUERY_KEY } from './use-conversations';

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
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      conversationsApi.unhideConversation(conversationId),
    onSuccess: async (_result, conversationId) => {
      await queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      router.push(`/messages/${conversationId}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
