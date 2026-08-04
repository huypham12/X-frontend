'use client';

import type { RefObject } from 'react';
import { ArrowLeft, RotateCcw, X } from 'lucide-react';
import { useFriendPresence } from '@/features/users/hooks/use-friend-presence';
import { useConversationDetailsStore } from '../stores/conversation-details.store';
import { useConversations } from '../hooks/use-conversations';
import { ConversationDetailsOverview } from './conversation-details-overview';
import { ConversationSearchView } from './conversation-search-view';
import { ConversationMediaView } from './conversation-media-view';
import { GroupMembersView } from './group-members-view';

interface ConversationDetailsPanelProps {
  conversationId: string;
  panelId: string;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}

const ConversationDetailsSkeleton = () => (
  <div role="status" aria-busy="true" aria-label="Loading conversation details">
    <div
      aria-hidden="true"
      className="flex animate-pulse items-center gap-3 px-4 py-4 motion-reduce:animate-none"
    >
      <div className="h-[52px] w-[52px] shrink-0 rounded-full bg-[#181818]" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-5 w-36 max-w-full rounded bg-[#181818]" />
        <div className="h-4 w-24 max-w-full rounded bg-[#181818]" />
        <div className="h-7 w-20 rounded-full bg-[#181818]" />
      </div>
    </div>
  </div>
);

export const ConversationDetailsPanel = ({
  conversationId,
  panelId,
  headingRef,
}: ConversationDetailsPanelProps) => {
  const {
    data: conversations,
    isLoading,
    isError,
    isFetching,
    isRefetchError,
    refetch,
  } = useConversations();
  const closeDetails = useConversationDetailsStore((state) => state.closeDetails);
  const view = useConversationDetailsStore((state) => state.view);
  const openView = useConversationDetailsStore((state) => state.openView);
  const { isOnlineFriend } = useFriendPresence();
  const conversation = conversations?.find((item) => item._id === conversationId);
  const panelTitle =
    view === 'search'
      ? 'Search messages'
      : view === 'media'
        ? 'Shared media'
        : view === 'members'
          ? 'Group members'
          : 'Conversation details';

  return (
    <section
      id={panelId}
      aria-labelledby={`${panelId}-title`}
      className="flex h-full min-h-0 w-full flex-col bg-black text-white"
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#2f3336] px-4">
        <div className="flex min-w-0 items-center gap-2">
          {view !== 'overview' && (
            <button
              type="button"
              onClick={() => openView('overview')}
              aria-label="Back to conversation details"
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full p-2 text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          <h2
            id={`${panelId}-title`}
            ref={headingRef}
            tabIndex={headingRef ? -1 : undefined}
            className="truncate text-lg font-bold outline-none"
          >
            {panelTitle}
          </h2>
        </div>
        <button
          type="button"
          onClick={closeDetails}
          aria-label="Close conversation details"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isRefetchError && conversations && (
          <div
            role="status"
            className="flex min-h-11 items-center justify-between gap-3 border-b border-[#2f3336] bg-[#121212] px-4 py-2 text-xs text-gray-300"
          >
            <span>Could not refresh conversation details.</span>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="min-h-11 shrink-0 rounded-full px-3 font-semibold text-white hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isFetching ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        )}
        {isLoading ? (
          <ConversationDetailsSkeleton />
        ) : isError && !conversations ? (
          <div role="alert" className="flex flex-col items-center px-6 py-12 text-center">
            <p className="text-sm text-gray-400">Could not load conversation details.</p>
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#536471] px-5 text-sm font-semibold transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : conversation && view === 'search' ? (
          <ConversationSearchView conversation={conversation} />
        ) : conversation && view === 'media' ? (
          <ConversationMediaView conversationId={conversation._id} />
        ) : conversation?.type === 'group' && view === 'members' ? (
          <GroupMembersView conversation={conversation} />
        ) : conversation ? (
          <ConversationDetailsOverview
            conversation={conversation}
            isPartnerOnline={conversation.type === 'direct' && isOnlineFriend(conversation.partner_id)}
          />
        ) : (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            This conversation is no longer available.
          </div>
        )}
      </div>
    </section>
  );
};
