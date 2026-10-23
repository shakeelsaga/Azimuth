'use client';

import { SessionProvider } from 'next-auth/react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import type { ReactNode } from 'react';

export function ClientProviders({ children }: { children: ReactNode }) {
  useKeyboardShortcuts();
  useOnlineStatus();
  return (
    <SessionProvider>
      <ErrorBoundary>{children}</ErrorBoundary>
    </SessionProvider>
  );
}
