'use client';

import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userService } from '@/features/users/api/user.service';

interface ApiErrorBody {
  message?: string;
}

export const conversationPartnerProfileQueryKey = (username: string) =>
  ['user', username] as const;

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message || fallbackMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
};

export const useConversationPartnerProfile = (username?: string) =>
  useQuery({
    queryKey: conversationPartnerProfileQueryKey(username ?? ''),
    queryFn: () => userService.getProfile(username ?? ''),
    enabled: Boolean(username),
    select: (profiles) => profiles[0] ?? null,
  });

export const useConversationPartnerBlockAction = (username?: string) => {
  const queryClient = useQueryClient();
  const profileQuery = useConversationPartnerProfile(username);
  const mutation = useMutation({
    mutationFn: async (shouldBlock: boolean) => {
      const partnerId = profileQuery.data?._id;
      if (!partnerId) throw new Error('Conversation partner is unavailable.');

      if (shouldBlock) {
        await userService.blockUser(partnerId);
      } else {
        await userService.unblockUser(partnerId);
      }
    },
    onSuccess: async (_data, shouldBlock) => {
      if (username) {
        await queryClient.invalidateQueries({
          queryKey: conversationPartnerProfileQueryKey(username),
        });
      }
      toast.success(shouldBlock ? 'User blocked.' : 'User unblocked.');
    },
    onError: (error, shouldBlock) => {
      toast.error(
        getErrorMessage(error, shouldBlock ? 'Could not block this user.' : 'Could not unblock this user.'),
      );
    },
  });

  const setBlocked = async (shouldBlock: boolean) => {
    try {
      await mutation.mutateAsync(shouldBlock);
      return true;
    } catch {
      return false;
    }
  };

  return {
    ...profileQuery,
    isBlockPending: mutation.isPending,
    setBlocked,
  };
};
