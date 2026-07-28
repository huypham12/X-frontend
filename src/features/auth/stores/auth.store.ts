import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

export interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  avatar: string;
  cover_photo?: string;
  bio?: string;
  verify: number;
  tweet_count?: number;
  follower_count?: number;
  following_count?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        Cookies.set('access_token', accessToken, { expires: 1 }); // 1 day
        Cookies.set('refresh_token', refreshToken, { expires: 30 }); // 30 days
        set({ user, isAuthenticated: true });
      },

      logout: () => {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
