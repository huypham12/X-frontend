'use client';

import { Toaster } from 'sonner';
import { useAuthStore } from '@/features/auth/stores/auth.store';

import { AuthInitializer } from './auth-initializer';
import { PersonalSessionBoundary } from './personal-session-boundary';

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const sessionBoundaryKey = useAuthStore(
    (state) =>
      `${state.sessionGeneration}:${state.isAuthenticated && state.user ? state.user._id : 'anonymous'}`,
  );

  return (
    <>
      <AuthInitializer />
      <PersonalSessionBoundary key={sessionBoundaryKey}>
        {children}
      </PersonalSessionBoundary>
      <Toaster position="bottom-center" richColors theme="dark" />
    </>
  );
}
