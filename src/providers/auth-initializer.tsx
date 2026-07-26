'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { userService } from '@/features/users/api/user.service';
import Cookies from 'js-cookie';

export function AuthInitializer() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const fetchUser = async () => {
      const token = Cookies.get('access_token');
      // Chỉ fetch nếu có token mà chưa có user
      if (token && !user) {
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
    fetchUser();
  }, [setAuth, user, isAuthenticated]);

  return null;
}
