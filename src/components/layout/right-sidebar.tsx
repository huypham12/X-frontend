'use client';
import { SearchBar } from '@/features/search/components/search-bar';
import { WhoToFollow } from '@/features/users/components/who-to-follow';
import { OnlineFriends } from '@/features/users/components/online-friends';
import { ConversationSidebar } from '@/features/conversations/components/conversation-sidebar';
import { ConversationDetailsPanel } from '@/features/conversations/components/conversation-details-panel';
import { useConversationDetailsStore } from '@/features/conversations/stores/conversation-details.store';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function RightSidebar() {
  const pathname = usePathname();
  const isMessagesPage = pathname.startsWith('/messages');
  const routeConversationId = pathname.match(/^\/messages\/([^/]+)$/)?.[1] ?? null;
  const openConversationId = useConversationDetailsStore((state) => state.openConversationId);
  const prefersReducedMotion = useReducedMotion();
  const showConversationDetails = Boolean(
    routeConversationId && openConversationId === routeConversationId,
  );

  if (isMessagesPage) {
    return (
      <aside className="sticky top-0 hidden h-screen w-[350px] shrink-0 flex-col overflow-hidden lg:flex">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={showConversationDetails ? 'conversation-details' : 'conversation-list'}
            className="h-full w-full"
            initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -10 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' }}
          >
            {showConversationDetails && routeConversationId ? (
              <ConversationDetailsPanel
                conversationId={routeConversationId}
                panelId="conversation-details-panel-desktop"
              />
            ) : (
              <ConversationSidebar />
            )}
          </motion.div>
        </AnimatePresence>
      </aside>
    );
  }

  return (
    <aside className="w-[350px] shrink-0 hidden lg:flex flex-col p-4 sticky top-0 h-screen space-y-4 overflow-y-auto">
      <div className="sticky top-0 bg-black pt-1 pb-2 z-10">
        <SearchBar />
      </div>

      <OnlineFriends />
      <WhoToFollow />
    </aside>
  );
}
