'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';

import { AuthInitializer } from './auth-initializer';
import { PersonalSessionBoundary } from './personal-session-boundary';

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PersonalSessionBoundary />
      <AuthInitializer />
      {children}
      <Toaster position="bottom-center" richColors theme="dark" />
    </QueryClientProvider>
  );
}
