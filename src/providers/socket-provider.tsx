'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { selectIsSessionReady, useAuthStore } from '@/features/auth/stores/auth.store';
import { clearClientAuth, refreshAccessToken } from '@/services/api.client';

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
  const isSessionReady = useAuthStore(selectIsSessionReady);
  const currentUserId = useAuthStore((state) => state.user?._id ?? null);
  const logout = useAuthStore((state) => state.logout);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isSessionReady) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    let disposed = false;
    let socketInstance: Socket | null = null;
    let refreshingAuthentication = false;

    const clearInvalidSession = () => {
      clearClientAuth();
      logout();
    };

    const connect = async () => {
      let token = Cookies.get('access_token');
      if (!token) {
        try {
          token = await refreshAccessToken();
        } catch {
          if (!disposed) clearInvalidSession();
          return;
        }
      }

      if (disposed) return;

      socketInstance = io(baseUrl, {
        autoConnect: false,
        auth: (callback) => callback({ token: Cookies.get('access_token') }),
      });
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        setIsConnected(true);
      });

      const handleDisconnected = () => {
        setIsConnected(false);
      };

      const handleConnectError = async (error: Error) => {
        setIsConnected(false);
        console.error('Socket connection failed:', error.message);

        if (!error.message.startsWith('Authentication error:') || refreshingAuthentication) return;
        refreshingAuthentication = true;
        try {
          await refreshAccessToken();
          if (!disposed) socketInstance?.connect();
        } catch {
          if (!disposed) clearInvalidSession();
        } finally {
          refreshingAuthentication = false;
        }
      };

      socketInstance.on('disconnect', handleDisconnected);
      socketInstance.on('connect_error', handleConnectError);

      socketInstance.connect();
    };

    void connect();

    return () => {
      disposed = true;
      socketInstance?.removeAllListeners();
      socketInstance?.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [currentUserId, isSessionReady, logout]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
