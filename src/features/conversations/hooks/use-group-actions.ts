'use client';

import { useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { mediaService } from '@/features/media/api/media.service';
import type { MediaMetadata } from '@/features/media/types/media.type';
import { userService } from '@/features/users/api/user.service';
import type { Friend } from '@/features/users/types/user.type';
import { conversationsApi } from '../api/conversations.api';
import { useConversationDetailsStore } from '../stores/conversation-details.store';
import type { Conversation, GroupConversation } from '../types';
import type { UpdateGroupPayload } from '../types/group-action.type';
import { CONVERSATION_MEDIA_QUERY_KEY } from './use-conversation-media';
import { CONVERSATIONS_QUERY_KEY } from './use-conversations';
import { GROUP_MEMBERS_QUERY_KEY } from './use-group-members';
import { MESSAGES_QUERY_KEY } from './use-messages';

interface ApiErrorBody {
  code?: string;
  message?: string;
}

const AVATAR_POLL_INTERVAL_MS = 2_000;
const AVATAR_POLL_ATTEMPTS = 60;
const SOLE_ADMIN_CANNOT_LEAVE_CODE = 'GROUP_SOLE_ADMIN_CANNOT_LEAVE';

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

const getErrorCode = (error: unknown) =>
  axios.isAxiosError<ApiErrorBody>(error) ? error.response?.data?.code : undefined;

const getReadyMediaUrl = (media: MediaMetadata) => {
  if (media.status === 'failed') {
    throw new Error('The group avatar could not be processed. Choose another image.');
  }

  return media.status === 'ready' && media.url ? media.url : null;
};

export const uploadReadyGroupAvatar = async (file: File) => {
  const uploadedMedias = await mediaService.uploadImage(file);
  const uploadedAvatar = uploadedMedias[0];

  if (!uploadedAvatar?._id) {
    throw new Error('The upload response did not include an image.');
  }

  const immediateUrl = getReadyMediaUrl(uploadedAvatar);
  if (immediateUrl) return immediateUrl;

  for (let attempt = 0; attempt < AVATAR_POLL_ATTEMPTS; attempt += 1) {
    await wait(AVATAR_POLL_INTERVAL_MS);
    const media = await mediaService.getMedia(uploadedAvatar._id);
    const readyUrl = getReadyMediaUrl(media);
    if (readyUrl) return readyUrl;
  }

  throw new Error('The group avatar is still processing. Try saving again in a moment.');
};

export const isCurrentUserGroupAdmin = (
  conversation: GroupConversation,
  currentUserId: string | undefined,
) =>
  Boolean(
    currentUserId &&
      conversation.members.some(
        (member) => member.user_id === currentUserId && member.role === 'admin',
      ),
  );

export const useGroupMemberCandidates = (
  keyword: string,
  excludedMemberIds: string[],
) => {
  const currentUserId = useAuthStore((state) => state.user?._id);
  const query = useQuery({
    queryKey: ['following', currentUserId],
    queryFn: () => {
      if (!currentUserId) throw new Error('Your account information is not available yet.');
      return userService.getFollowing(currentUserId);
    },
    enabled: Boolean(currentUserId),
    refetchOnMount: 'always',
  });

  const candidates = useMemo(() => {
    const excludedIds = new Set([...excludedMemberIds, ...(currentUserId ? [currentUserId] : [])]);
    const normalizedKeyword = keyword.trim().toLowerCase();
    const uniqueCandidates = new Map<string, Friend>();

    query.data?.following?.forEach((candidate) => {
      if (excludedIds.has(candidate._id)) return;
      if (
        normalizedKeyword &&
        !candidate.name.toLowerCase().includes(normalizedKeyword) &&
        !candidate.username.toLowerCase().includes(normalizedKeyword)
      ) {
        return;
      }
      uniqueCandidates.set(candidate._id, candidate);
    });

    return [...uniqueCandidates.values()];
  }, [currentUserId, excludedMemberIds, keyword, query.data]);

  return {
    ...query,
    candidates,
    followingCount: query.data?.following?.length ?? 0,
  };
};

export const useGroupActions = (conversation: GroupConversation) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?._id);
  const closeDetails = useConversationDetailsStore((state) => state.closeDetails);
  const isAdmin = isCurrentUserGroupAdmin(conversation, currentUserId);
  const invalidateGroupData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: GROUP_MEMBERS_QUERY_KEY(conversation._id) }),
    ]);
  };
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateGroupPayload) =>
      conversationsApi.updateGroupInfo(conversation._id, payload),
    onSuccess: async (_result, payload) => {
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (conversations) =>
        conversations?.map((currentConversation) =>
          currentConversation._id === conversation._id && currentConversation.type === 'group'
            ? { ...currentConversation, ...payload }
            : currentConversation,
        ),
      );
      await queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      toast.success('Group details updated.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not update the group.'));
    },
  });
  const addMembersMutation = useMutation({
    mutationFn: (memberIds: string[]) =>
      conversationsApi.addGroupMembers(conversation._id, [...new Set(memberIds)]),
    onSuccess: async () => {
      await invalidateGroupData();
      toast.success('Members added to the group.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not add these members.'));
    },
  });
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      conversationsApi.removeGroupMember(conversation._id, memberId),
    onSuccess: async () => {
      await invalidateGroupData();
      toast.success('Member removed from the group.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Could not remove this member.'));
    },
  });
  const leaveGroupMutation = useMutation({
    mutationFn: () => conversationsApi.leaveGroup(conversation._id),
    onSuccess: async () => {
      const conversationQueryKeys = [
        GROUP_MEMBERS_QUERY_KEY(conversation._id),
        MESSAGES_QUERY_KEY(conversation._id),
        CONVERSATION_MEDIA_QUERY_KEY(conversation._id),
        ['conversation-message-search', conversation._id],
        ['conversation-message-context', conversation._id],
      ];

      await Promise.all(
        conversationQueryKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })),
      );
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (conversations) =>
        conversations?.filter((item) => item._id !== conversation._id),
      );
      conversationQueryKeys.forEach((queryKey) => {
        queryClient.removeQueries({ queryKey });
      });
      closeDetails();
      router.replace('/messages');
      await queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      toast.success('You left the group.');
    },
    onError: (error) => {
      if (getErrorCode(error) === SOLE_ADMIN_CANNOT_LEAVE_CODE) {
        toast.error('You are the only admin. Remove the remaining members before leaving.');
        return;
      }
      toast.error(getErrorMessage(error, 'Could not leave this group.'));
    },
  });

  const addGroupMembers = async (memberIds: string[]) => {
    try {
      await addMembersMutation.mutateAsync(memberIds);
      return true;
    } catch {
      return false;
    }
  };

  const removeGroupMember = async (memberId: string) => {
    try {
      await removeMemberMutation.mutateAsync(memberId);
      return true;
    } catch {
      return false;
    }
  };

  const leaveGroup = async () => {
    try {
      await leaveGroupMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  return {
    isAdmin,
    isUpdatePending: updateMutation.isPending,
    isAddMembersPending: addMembersMutation.isPending,
    isRemoveMemberPending: removeMemberMutation.isPending,
    removingMemberId: removeMemberMutation.isPending ? removeMemberMutation.variables : undefined,
    isLeaveGroupPending: leaveGroupMutation.isPending,
    updateGroupInfo: updateMutation.mutateAsync,
    uploadGroupAvatar: uploadReadyGroupAvatar,
    addGroupMembers,
    removeGroupMember,
    leaveGroup,
  };
};
