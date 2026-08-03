'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { userService } from '@/features/users/api/user.service';
import Cookies from 'js-cookie';
import { refreshAccessToken } from '@/services/api.client';
import { getAuthenticatedUser } from '@/features/auth/utils/auth-user';

export function AuthInitializer() {
  const startAuthentication = useAuthStore((state) => state.startAuthentication);
  const setAuthenticationTokens = useAuthStore((state) => state.setAuthenticationTokens);
  const completeAuthentication = useAuthStore((state) => state.completeAuthentication);
  const failAuthentication = useAuthStore((state) => state.failAuthentication);

  useEffect(() => {
    let disposed = false;

    const hydrateSession = async () => {
      const attemptId = startAuthentication();
      let token = Cookies.get('access_token');
      if (!token) {
        if (!Cookies.get('refresh_token')) {
          if (!disposed) failAuthentication(attemptId);
          return;
        }
        try {
          token = await refreshAccessToken();
        } catch {
          if (!disposed) failAuthentication(attemptId);
          return;
        }
      }

      if (disposed) return;
      const isCurrentAttempt = setAuthenticationTokens(
        attemptId,
        token,
        Cookies.get('refresh_token'),
      );
      if (!isCurrentAttempt) return;

      try {
        const userData: unknown = await userService.getMe();
        const currentUser = getAuthenticatedUser(userData);
        if (!currentUser) throw new Error('Invalid current-user response');
        if (!disposed) completeAuthentication(attemptId, currentUser);
      } catch {
        if (!disposed) failAuthentication(attemptId);
      }
    };

    void hydrateSession();
    return () => {
      disposed = true;
    };
  }, [completeAuthentication, failAuthentication, setAuthenticationTokens, startAuthentication]);

  return null;
}
