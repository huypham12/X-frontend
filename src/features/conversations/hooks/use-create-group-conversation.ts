import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import {
  captureAuthSession,
  isAuthSessionCurrent,
  useAuthStore,
} from '@/features/auth/stores/auth.store';
import { mediaService } from '@/features/media/api/media.service';
import { userService } from '@/features/users/api/user.service';
import type { Friend } from '@/features/users/types/user.type';
import { conversationsApi } from '../api/conversations.api';
import { useConversationDetailsStore } from '../stores/conversation-details.store';
import type { CreateGroupMutationInput } from '../types/create-group.type';
import { CONVERSATIONS_QUERY_KEY } from './use-conversations';

interface ApiErrorBody {
  message?: string;
}

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message || 'Could not create the group.';
  }

  return error instanceof Error ? error.message : 'Could not create the group.';
};

export const useGroupMemberCandidates = (partnerId: string) => {
  const currentUserId = useAuthStore((state) => state.user?._id);
  const query = useQuery({
    queryKey: ['following', currentUserId],
    queryFn: () => {
      if (!currentUserId) throw new Error('Your account information is not available yet.');
      return userService.getFollowing(currentUserId);
    },
    enabled: Boolean(currentUserId),
  });

  const candidates = useMemo(() => {
    const uniqueCandidates = new Map<string, Friend>();
    query.data?.following?.forEach((candidate) => {
      if (candidate._id === currentUserId || candidate._id === partnerId) return;
      uniqueCandidates.set(candidate._id, candidate);
    });
    return [...uniqueCandidates.values()];
  }, [currentUserId, partnerId, query.data]);

  return { ...query, candidates };
};

export const useCreateGroupConversation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const closeDetails = useConversationDetailsStore((state) => state.closeDetails);
  const session = captureAuthSession();

  return useMutation({
    mutationFn: async ({ name, members, avatarFile }: CreateGroupMutationInput) => {
      let avatarUrl: string | undefined;

      if (avatarFile) {
        const uploadedMedias = await mediaService.uploadImage(avatarFile);
        const uploadedAvatar = uploadedMedias.find((media) => media.status === 'ready' && media.url);
        if (!uploadedAvatar?.url) {
          throw new Error('The group avatar could not be processed. Remove it or try again.');
        }
        avatarUrl = uploadedAvatar.url;
      }

      return conversationsApi.createGroupConversation({
        name: name.trim(),
        members: [...new Set(members)],
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });
    },
    onSuccess: async (group) => {
      if (!isAuthSessionCurrent(session)) return;
      await queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      if (!isAuthSessionCurrent(session)) return;
      closeDetails();
      router.push(`/messages/${group._id}`);
    },
    onError: (error) => {
      if (!isAuthSessionCurrent(session)) return;
      toast.error(getErrorMessage(error));
    },
  });
};
