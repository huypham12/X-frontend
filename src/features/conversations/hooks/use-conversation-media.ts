import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations.api';
import type { SharedConversationMedia } from '../types/conversation-media.type';

const CONVERSATION_MEDIA_PAGE_SIZE = 20;

export const CONVERSATION_MEDIA_QUERY_KEY = (conversationId: string) => [
  'conversation-media',
  conversationId,
];

export const useConversationMedia = (conversationId: string) => {
  const query = useInfiniteQuery({
    queryKey: CONVERSATION_MEDIA_QUERY_KEY(conversationId),
    queryFn: ({ pageParam }) =>
      conversationsApi.getConversationMedia(
        conversationId,
        CONVERSATION_MEDIA_PAGE_SIZE,
        pageParam,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });

  const medias = useMemo(() => {
    const uniqueMedias = new Map<string, SharedConversationMedia>();

    query.data?.pages.forEach((page) => {
      page.messages.forEach((message) => {
        message.medias_info?.forEach((media) => {
          if (uniqueMedias.has(media._id)) return;

          uniqueMedias.set(media._id, {
            ...media,
            messageId: message._id,
            senderId: message.sender_id,
            sentAt: message.send_at,
          });
        });
      });
    });

    return [...uniqueMedias.values()];
  }, [query.data]);

  return { ...query, medias };
};
