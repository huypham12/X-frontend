import { useEffect } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useSocket } from '@/providers/socket-provider';
import type { Conversation, Message, MessageType, PaginationResponse } from '../types';
import { CONVERSATIONS_QUERY_KEY } from './use-conversations';
import { MESSAGES_QUERY_KEY } from './use-messages';

export const useChatSocket = (conversationId?: string) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleReceiveMessage = (newMessage: Message) => {
      const messageType: MessageType = newMessage.medias_info?.[0]?.type || 'text';

      // 1. Update Messages list if we are currently viewing this conversation
      if (conversationId && newMessage.conversation_id === conversationId) {
        queryClient.setQueryData<InfiniteData<PaginationResponse<Message>, string | undefined>>(
          MESSAGES_QUERY_KEY(conversationId),
          (oldData) => {
            if (!oldData) return oldData;
          
            // The API returns newest messages first, so prepend to the first page.
            const newPages = oldData.pages.map((page, index) =>
              index === 0
                ? { ...page, messages: [newMessage, ...page.messages] }
                : page
            );

            return { ...oldData, pages: newPages };
          }
        );
      }

      // 2. Update Conversations list (last message preview & timestamp)
      queryClient.setQueryData(CONVERSATIONS_QUERY_KEY, (oldConversations: Conversation[] | undefined) => {
        if (!oldConversations) return oldConversations;

        const updated = oldConversations.map(conv => {
          if (conv._id === newMessage.conversation_id) {
            return {
              ...conv,
              last_message_at: newMessage.send_at,
              last_message_preview: {
                sender_id: newMessage.sender_id,
                content: newMessage.content,
                message_type: messageType
              }
            };
          }
          return conv;
        });

        // Re-sort so that the updated conversation jumps to the top (below pinned)
        return updated.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          
          const timeA = new Date(a.last_message_at || 0).getTime();
          const timeB = new Date(b.last_message_at || 0).getTime();
          return timeB - timeA;
        });
      });
    };

    socket.on('@conversation:receive', handleReceiveMessage);

    return () => {
      socket.off('@conversation:receive', handleReceiveMessage);
    };
  }, [socket, isConnected, queryClient, conversationId]);

  const sendMessage = (payload: { conversation_id: string, conversation_type: 'direct' | 'group', content: string, media_ids?: string[], reply_to_message_id?: string }) => {
    if (socket && isConnected) {
      socket.emit('@conversation:send', payload);
    }
  };

  const emitTyping = (payload: { conversation_id: string, conversation_type: 'direct' | 'group', isTyping: boolean }) => {
    if (socket && isConnected) {
      const event = payload.isTyping ? '@conversation:typing_on' : '@conversation:typing_off';
      socket.emit(event, { conversation_id: payload.conversation_id, conversation_type: payload.conversation_type });
    }
  };

  return { sendMessage, emitTyping };
};
