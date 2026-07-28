import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { conversationsApi } from '../api/conversations.api';

interface ApiErrorBody {
  message?: string;
}

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message || 'Could not open this conversation.';
  }

  return error instanceof Error ? error.message : 'Could not open this conversation.';
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (userId: string) => conversationsApi.getOrCreateDirectConversation(userId),
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.push(`/messages/${conversation._id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
};
