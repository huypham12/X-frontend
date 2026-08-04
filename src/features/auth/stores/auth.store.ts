import { create } from 'zustand';
import Cookies from 'js-cookie';

export interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  avatar?: string;
  cover_photo?: string;
  bio?: string;
  verify?: number;
  tweet_count?: number;
  follower_count?: number;
  following_count?: number;
}

export type AuthenticationAttemptId = number;

export interface AuthSessionToken {
  generation: number;
  userId: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  sessionGeneration: number;
  activeAuthenticationAttemptId: AuthenticationAttemptId | null;
  startAuthentication: () => AuthenticationAttemptId;
  setAuthenticationTokens: (
    attemptId: AuthenticationAttemptId,
    accessToken: string,
    refreshToken?: string,
  ) => boolean;
  completeAuthentication: (attemptId: AuthenticationAttemptId, user: User) => boolean;
  failAuthentication: (attemptId: AuthenticationAttemptId) => boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

let nextAuthenticationAttemptId = 0;

const storeTokens = (accessToken: string, refreshToken?: string) => {
  Cookies.set('access_token', accessToken, { expires: 1 });
  if (refreshToken) Cookies.set('refresh_token', refreshToken, { expires: 30 });
};

const clearLegacyPersistedAuth = () => {
  if (typeof window !== 'undefined') localStorage.removeItem('auth-storage');
};

export const selectIsSessionReady = (state: AuthState) =>
  state.isAuthenticated && !state.isInitializing && state.user !== null;

export const captureAuthSession = (): AuthSessionToken => {
  const state = useAuthStore.getState();
  return {
    generation: state.sessionGeneration,
    userId: state.isAuthenticated ? (state.user?._id ?? null) : null,
  };
};

export const isAuthSessionCurrent = (session: AuthSessionToken) => {
  const state = useAuthStore.getState();
  return (
    state.isAuthenticated &&
    state.sessionGeneration === session.generation &&
    state.user?._id === session.userId
  );
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  sessionGeneration: 0,
  activeAuthenticationAttemptId: null,

  startAuthentication: () => {
    nextAuthenticationAttemptId += 1;
    const attemptId = nextAuthenticationAttemptId;
    clearLegacyPersistedAuth();
    set({
      user: null,
      isAuthenticated: false,
      isInitializing: true,
      sessionGeneration: get().sessionGeneration + 1,
      activeAuthenticationAttemptId: attemptId,
    });
    return attemptId;
  },

  setAuthenticationTokens: (attemptId, accessToken, refreshToken) => {
    if (get().activeAuthenticationAttemptId !== attemptId) return false;
    storeTokens(accessToken, refreshToken);
    return true;
  },

  completeAuthentication: (attemptId, user) => {
    if (get().activeAuthenticationAttemptId !== attemptId) return false;
    set({
      user,
      isAuthenticated: true,
      isInitializing: false,
      activeAuthenticationAttemptId: null,
    });
    return true;
  },

  failAuthentication: (attemptId) => {
    if (get().activeAuthenticationAttemptId !== attemptId) return false;
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    clearLegacyPersistedAuth();
    set({
      user: null,
      isAuthenticated: false,
      isInitializing: false,
      activeAuthenticationAttemptId: null,
    });
    return true;
  },

  setAuth: (user, accessToken, refreshToken) => {
    storeTokens(accessToken, refreshToken);
    set({
      user,
      isAuthenticated: true,
      isInitializing: false,
      sessionGeneration: get().sessionGeneration + 1,
      activeAuthenticationAttemptId: null,
    });
  },

  logout: () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    clearLegacyPersistedAuth();
    set({
      user: null,
      isAuthenticated: false,
      isInitializing: false,
      sessionGeneration: get().sessionGeneration + 1,
      activeAuthenticationAttemptId: null,
    });
  },
}));
