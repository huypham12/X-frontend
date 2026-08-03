'use client';

import { useConversationSocketSync } from '@/features/conversations/hooks/use-conversation-socket-sync';
import { useNotificationSocketSync } from '@/features/notifications/hooks/use-notification-socket-sync';
import { usePersonalQueryReconciliation } from '@/features/realtime/hooks/use-personal-query-reconciliation';
import { useUserSocketSync } from '@/features/users/hooks/use-user-socket-sync';
import { useSocket } from './socket-provider';

export function RealtimeSyncProvider({ children }: { children: React.ReactNode }) {
  const { socket, isConnected } = useSocket();

  useNotificationSocketSync(socket);
  useConversationSocketSync(socket);
  useUserSocketSync(socket);
  usePersonalQueryReconciliation(isConnected);

  return <>{children}</>;
}
