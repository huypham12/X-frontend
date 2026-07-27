import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations.api';

const MESSAGE_SEARCH_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 275;

export const MESSAGE_SEARCH_QUERY_KEY = (conversationId: string, keyword: string) => [
  'conversation-message-search',
  conversationId,
  keyword,
];

export const useMessageSearch = (conversationId: string, keyword: string) => {
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [keyword]);

  const query = useInfiniteQuery({
    queryKey: MESSAGE_SEARCH_QUERY_KEY(conversationId, debouncedKeyword),
    queryFn: ({ pageParam }) =>
      conversationsApi.searchMessages(
        conversationId,
        debouncedKeyword,
        MESSAGE_SEARCH_LIMIT,
        pageParam,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: debouncedKeyword.length > 0,
  });

  return {
    ...query,
    debouncedKeyword,
    isDebouncing: keyword.trim() !== debouncedKeyword,
  };
};
