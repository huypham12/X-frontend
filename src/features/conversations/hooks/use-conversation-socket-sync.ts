'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import type { GroupUpdatedEvent } from '../types/group-action.type';
import { CONVERSATIONS_QUERY_KEY } from './use-conversations';
import { GROUP_MEMBERS_QUERY_KEY } from './use-group-members';

export const useConversationSocketSync = (socket: Socket | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleGroupUpdated = (event: GroupUpdatedEvent) => {
      if (!event?.conversation_id) return;

      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      void queryClient.invalidateQueries({
        queryKey: GROUP_MEMBERS_QUERY_KEY(event.conversation_id),
      });
    };

    socket.on('@conversation:group-updated', handleGroupUpdated);

    return () => {
      socket.off('@conversation:group-updated', handleGroupUpdated);
    };
  }, [queryClient, socket]);
};
