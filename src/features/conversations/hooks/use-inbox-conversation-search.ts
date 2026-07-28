import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { userService } from '@/features/users/api/user.service';
import { conversationsApi } from '../api/conversations.api';

const GROUP_LOOKUP_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 275;

export const GROUP_CONVERSATION_LOOKUP_QUERY_KEY = (keyword: string) => [
  'group-conversation-lookup',
  keyword,
];

export const useInboxConversationSearch = (keyword: string) => {
  const currentUserId = useAuthStore((state) => state.user?._id);
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const normalizedKeyword = keyword.trim().toLocaleLowerCase();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [keyword]);

  const followingQuery = useQuery({
    queryKey: ['following', currentUserId],
    queryFn: () => userService.getFollowing(currentUserId as string),
    enabled: Boolean(currentUserId),
  });

  const groupQuery = useInfiniteQuery({
    queryKey: GROUP_CONVERSATION_LOOKUP_QUERY_KEY(debouncedKeyword),
    queryFn: ({ pageParam }) =>
      conversationsApi.searchGroupConversations(
        debouncedKeyword,
        GROUP_LOOKUP_LIMIT,
        pageParam,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: debouncedKeyword.length > 0,
  });

  const people = useMemo(() => {
    const following = followingQuery.data?.following ?? [];
    if (!normalizedKeyword) return following;

    return following.filter(
      (person) =>
        person.name.toLocaleLowerCase().includes(normalizedKeyword) ||
        person.username.toLocaleLowerCase().includes(normalizedKeyword),
    );
  }, [followingQuery.data?.following, normalizedKeyword]);

  const isDebouncing = keyword.trim() !== debouncedKeyword;
  const groups = isDebouncing
    ? []
    : (groupQuery.data?.pages.flatMap((page) => page.groups) ?? []);

  return {
    people,
    groups,
    debouncedKeyword,
    isDebouncing,
    isPeopleLoading: followingQuery.isLoading,
    isPeopleError: followingQuery.isError,
    retryPeople: followingQuery.refetch,
    isGroupsLoading: groupQuery.isLoading,
    isGroupsError: groupQuery.isError,
    retryGroups: groupQuery.refetch,
    hasNextGroupsPage: groupQuery.hasNextPage,
    isFetchingNextGroupsPage: groupQuery.isFetchingNextPage,
    fetchNextGroupsPage: groupQuery.fetchNextPage,
  };
};
