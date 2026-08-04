'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import {
  captureAuthSession,
  isAuthSessionCurrent,
} from '@/features/auth/stores/auth.store';

export const useUserSocketSync = (socket: Socket | null) => {
  const sessionRef = useRef(captureAuthSession());
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleBlockStatusChanged = () => {
      if (!isAuthSessionCurrent(sessionRef.current)) return;
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    };

    socket.on('@user:block-status-changed', handleBlockStatusChanged);
    return () => {
      socket.off('@user:block-status-changed', handleBlockStatusChanged);
    };
  }, [queryClient, socket]);
};
