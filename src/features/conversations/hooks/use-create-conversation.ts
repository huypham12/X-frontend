import { useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations.api';
import { useRouter } from 'next/navigation';

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (userId: string) => conversationsApi.getOrCreateDirectConversation(userId),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.push(`/messages/${conversation._id}`);
    },
  });
};
