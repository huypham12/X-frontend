'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { useQueryClient } from '@tanstack/react-query';
import { useConversationSocketSync } from '@/features/conversations/hooks/use-conversation-socket-sync';
import { useAuthStore } from '@/features/auth/stores/auth.store';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  useConversationSocketSync(socket);

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!isAuthenticated || !token) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    const socketInstance = io(baseUrl, {
      auth: (callback) => callback({ token: Cookies.get('access_token') }),
    });

    socketInstance.on('connect', () => {
      setSocket(socketInstance);
      setIsConnected(true);
    });

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    const handleConnectError = (error: Error) => {
      setIsConnected(false);
      console.error('Socket connection failed:', error.message);
    };

    socketInstance.on('disconnect', handleDisconnected);
    socketInstance.on('connect_error', handleConnectError);

    const handleBlockStatusChanged = () => {
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    };

    socketInstance.on('@user:block-status-changed', handleBlockStatusChanged);

    return () => {
      socketInstance.off('@user:block-status-changed', handleBlockStatusChanged);
      socketInstance.off('disconnect', handleDisconnected);
      socketInstance.off('connect_error', handleConnectError);
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
