'use client';

import React, { useEffect, useRef } from 'react';
import { useConversations } from '../hooks/use-conversations';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { Info, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useFriendPresence } from '@/features/users/hooks/use-friend-presence';
import { FriendPresenceDot } from '@/features/users/components/friend-presence-dot';
import { useConversationDetailsStore } from '../stores/conversation-details.store';
import { ConversationDetailsMobile } from './conversation-details-mobile';
import { useConversationPartnerProfile } from '../hooks/use-conversation-partner-profile';
import { useMessageComposerStore } from '../stores/message-composer.store';
import { useActiveGroupMembershipReconciliation } from '../hooks/use-active-group-membership-reconciliation';

interface ChatWindowProps {
  conversationId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
  const router = useRouter();
  const {
    data: conversations,
    isLoading,
    isFetching,
    isError,
    isRefetchError,
    refetch,
  } = useConversations();
  const { isOnlineFriend } = useFriendPresence();
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const openConversationId = useConversationDetailsStore((state) => state.openConversationId);
  const toggleDetails = useConversationDetailsStore((state) => state.toggleDetails);
  const closeDetails = useConversationDetailsStore((state) => state.closeDetails);
  const prefersReducedMotion = useReducedMotion();
  const clearReply = useMessageComposerStore((state) => state.clearReply);
  const conversation = conversations?.find((item) => item._id === conversationId);
  useActiveGroupMembershipReconciliation({
    conversationId,
    conversation,
    isConversationListResolved: !isLoading && !isFetching && !isError && !isRefetchError,
  });
  const partnerUsername =
    conversation?.type === 'direct' ? conversation.partner_info?.username : undefined;
  const {
    data: partnerProfile,
    isLoading: isPartnerProfileLoading,
    isFetching: isPartnerProfileFetching,
    isError: isPartnerProfileError,
    refetch: refetchPartnerProfile,
  } = useConversationPartnerProfile(partnerUsername);
  const isDetailsOpen = openConversationId === conversationId;

  useEffect(() => {
    if (openConversationId && openConversationId !== conversationId) {
      closeDetails();
    }
  }, [closeDetails, conversationId, openConversationId]);

  useEffect(() => {
    clearReply();
    return clearReply;
  }, [clearReply, conversationId]);

  if (!conversation) {
    if (isError || isRefetchError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center bg-black px-6 text-center">
          <p className="text-sm text-gray-400">Could not load this conversation.</p>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="mt-4 rounded-full border border-[#536471] px-4 py-2 text-sm font-semibold text-white hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Retry
          </button>
        </div>
      );
    }

    if (isLoading || isFetching) {
      return (
        <div className="flex-1 flex items-center justify-center bg-black">
          <div
            role="status"
            aria-label="Loading conversation"
            className="h-24 w-24 animate-pulse rounded-full bg-[#181818]"
          />
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-black px-6 text-center">
        <p className="text-sm text-gray-400">This conversation is unavailable.</p>
        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          className="mt-4 min-h-11 rounded-full border border-[#536471] px-5 text-sm font-semibold text-white hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Retry
        </button>
      </div>
    );
  }

  let title = 'Unknown';
  let avatar = '/default-avatar.png';
  let profileLink: string | null = null;
  let isPartnerOnline = false;

  if (conversation.type === 'direct') {
    title = conversation.partner_info?.name || 'Unknown User';
    avatar = conversation.partner_info?.avatar || '/default-avatar.png';
    profileLink = conversation.partner_info?.username
      ? `/profile/${encodeURIComponent(conversation.partner_info.username)}`
      : null;
    isPartnerOnline = isOnlineFriend(conversation.partner_id);
  } else if (conversation.type === 'group') {
    title = conversation.name || 'Group Chat';
    avatar = conversation.avatar_url || '/default-group.png';
  }

  const messagingDisabledReason = partnerProfile?.is_blocked
    ? 'You blocked this user. Unblock them in Conversation details to send messages.'
    : partnerProfile?.is_blocked_by_user
      ? 'You cannot send direct messages to this user.'
      : conversation.type === 'direct' && (!partnerUsername || isPartnerProfileError)
        ? 'Could not verify whether direct messaging is available.'
      : undefined;

  const headerIdentity = (
    <>
      <div className="relative shrink-0">
        <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-600">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt={title} className="h-full w-full object-cover" />
        </div>
        <FriendPresenceDot isOnline={isPartnerOnline} />
      </div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </>
  );

  const handleExitConversation = () => {
    closeDetails();
    router.push('/messages');
  };

  return (
    <div className="sticky top-10 flex h-[calc(100dvh-2.5rem)] min-h-0 flex-1 flex-col overflow-hidden bg-black lg:top-0 lg:h-dvh">
      {/* Header */}
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-[#2f3336] bg-black/80 p-4 backdrop-blur-md">
        {profileLink ? (
          <Link href={profileLink} className="flex items-center gap-3 transition-opacity hover:opacity-80">
            {headerIdentity}
          </Link>
        ) : (
          <div className="flex items-center gap-3">{headerIdentity}</div>
        )}
        <div className="flex items-center gap-2">
          <motion.button
            ref={infoButtonRef}
            type="button"
            onClick={() => toggleDetails(conversationId)}
            aria-label={isDetailsOpen ? 'Close conversation details' : 'Open conversation details'}
            aria-pressed={isDetailsOpen}
            aria-controls="conversation-details-panel-desktop conversation-details-panel-mobile"
            whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
            animate={{ backgroundColor: isDetailsOpen ? '#181818' : 'rgba(24, 24, 24, 0)' }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className={`rounded-full p-2 transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              isDetailsOpen ? 'text-[#1d9bf0]' : 'text-white'
            }`}
          >
            <Info className="h-5 w-5" aria-hidden="true" />
          </motion.button>
          <button
            type="button"
            onClick={handleExitConversation}
            aria-label="Close conversation"
            className="rounded-full p-2 text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <MessageList conversationId={conversationId} />
      
      {/* Input */}
      <MessageInput
        key={conversationId}
        conversationId={conversationId} 
        conversationType={conversation.type}
        partnerUsername={partnerUsername}
        disabledReason={messagingDisabledReason}
        isMessagingAvailabilityLoading={
          conversation.type === 'direct' &&
          Boolean(partnerUsername) &&
          (isPartnerProfileLoading || isPartnerProfileFetching)
        }
        onRetryMessagingAvailability={
          conversation.type === 'direct' && (!partnerUsername || isPartnerProfileError)
            ? () => {
                if (partnerUsername) {
                  void refetchPartnerProfile();
                } else {
                  void refetch();
                }
              }
            : undefined
        }
      />

      <ConversationDetailsMobile
        conversationId={conversationId}
        returnFocusRef={infoButtonRef}
      />
    </div>
  );
};
