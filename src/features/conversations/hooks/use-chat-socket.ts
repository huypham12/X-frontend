import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/providers/socket-provider';
import { Message, Conversation } from '../types';
import { CONVERSATIONS_QUERY_KEY } from './use-conversations';
import { MESSAGES_QUERY_KEY } from './use-messages';

export const useChatSocket = (conversationId?: string) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleReceiveMessage = (newMessage: Message) => {
      // 1. Update Messages list if we are currently viewing this conversation
      if (conversationId && newMessage.conversation_id === conversationId) {
        queryClient.setQueryData(MESSAGES_QUERY_KEY(conversationId), (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;
          
          // messages are returned newest first in API? Yes: sort({_id: -1}) 
          // So new message goes to the beginning of the first page.
          const newPages = [...oldData.pages];
          if (newPages.length > 0) {
            newPages[0] = {
              ...newPages[0],
              messages: [newMessage, ...newPages[0].messages]
            };
          }
          return {
            ...oldData,
            pages: newPages,
          };
        });
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
                message_type: newMessage.media_ids && newMessage.media_ids.length > 0 ? 'image' : 'text'
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
