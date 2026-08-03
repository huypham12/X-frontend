'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';

export const useUserSocketSync = (socket: Socket | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleBlockStatusChanged = () => {
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    };

    socket.on('@user:block-status-changed', handleBlockStatusChanged);
    return () => {
      socket.off('@user:block-status-changed', handleBlockStatusChanged);
    };
  }, [queryClient, socket]);
};
