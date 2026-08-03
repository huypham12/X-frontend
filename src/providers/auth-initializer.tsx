'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { userService } from '@/features/users/api/user.service';
import Cookies from 'js-cookie';
import { refreshAccessToken } from '@/services/api.client';

export function AuthInitializer() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const fetchUser = async () => {
      let token = Cookies.get('access_token');
      if (!token) {
        if (!Cookies.get('refresh_token')) {
          logout();
          return;
        }
        try {
          token = await refreshAccessToken();
        } catch {
          logout();
          return;
        }
      }

      // Đồng bộ lại store persisted nếu cookie và auth state bị lệch nhau.
      if (!user || !isAuthenticated) {
        try {
          const data = await userService.getMe();
          if (data && data[0]) {
            setAuth(data[0], token, Cookies.get('refresh_token') || '');
          }
        } catch (error) {
          console.error("Failed to fetch user profile", error);
        }
      }
    };
    void fetchUser();
  }, [setAuth, logout, user, isAuthenticated]);

  return null;
}
