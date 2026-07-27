'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell, BellOff, Pin, PinOff, UserRound, UsersRound } from 'lucide-react';
import { FriendPresenceDot } from '@/features/users/components/friend-presence-dot';
import type { Conversation } from '../types';
import { useConversationActions } from '../hooks/use-conversation-actions';
import { MuteConversationDialog } from './mute-conversation-dialog';

interface ConversationDetailsOverviewProps {
  conversation: Conversation;
  isPartnerOnline: boolean;
}

const getInitials = (name: string) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return initials || '?';
};

export const ConversationDetailsOverview = ({
  conversation,
  isPartnerOnline,
}: ConversationDetailsOverviewProps) => {
  const [isMuteDialogOpen, setIsMuteDialogOpen] = useState(false);
  const isDirect = conversation.type === 'direct';
  const name = isDirect
    ? conversation.partner_info?.name || 'Unknown user'
    : conversation.name || 'Group chat';
  const avatar = isDirect ? conversation.partner_info?.avatar : conversation.avatar_url;
  const {
    isMuted,
    mutedUntil,
    isPinPending,
    isMutePending,
    togglePin,
    muteConversation,
    unmuteConversation,
  } = useConversationActions(conversation);

  const muteStatus = isMuted
    ? mutedUntil
      ? `Muted until ${new Intl.DateTimeFormat(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(mutedUntil))}`
      : 'Muted until you turn notifications back on'
    : null;

  return (
    <>
      <div className="flex flex-col items-center border-b border-[#2f3336] px-6 py-8 text-center">
        <div className="relative mb-4 shrink-0">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#181818] text-2xl font-semibold text-white ring-1 ring-white/10">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : isDirect ? (
              <UserRound className="h-10 w-10 text-gray-400" aria-hidden="true" />
            ) : (
              <UsersRound className="h-10 w-10 text-gray-400" aria-hidden="true" />
            )}
            {!avatar && <span className="sr-only">{getInitials(name)}</span>}
          </div>
          {isDirect && (
            <FriendPresenceDot
              isOnline={isPartnerOnline}
              showOffline
              className="h-5 w-5 border-[3px]"
            />
          )}
        </div>

        <h3 className="max-w-full truncate text-xl font-bold text-white">{name}</h3>

        {isDirect ? (
          <>
            {conversation.partner_info?.username && (
              <p className="mt-1 text-sm text-gray-500">@{conversation.partner_info.username}</p>
            )}
            <p className="mt-2 text-sm text-gray-400">
              {isPartnerOnline ? 'Online now' : 'Offline'}
            </p>
            {conversation.partner_info?.username && (
              <Link
                href={`/profile/${encodeURIComponent(conversation.partner_info.username)}`}
                className="mt-5 rounded-full border border-[#536471] px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                View profile
              </Link>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-400">
            {conversation.members.length} {conversation.members.length === 1 ? 'member' : 'members'}
          </p>
        )}
      </div>

      <div className="border-b border-[#2f3336] px-6 py-5">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={togglePin}
            disabled={isPinPending}
            aria-pressed={conversation.is_pinned}
            className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl bg-[#121212] px-3 py-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {conversation.is_pinned ? (
              <PinOff className="h-5 w-5 text-[#1d9bf0]" aria-hidden="true" />
            ) : (
              <Pin className="h-5 w-5" aria-hidden="true" />
            )}
            {conversation.is_pinned ? 'Unpin' : 'Pin'}
          </button>

          <button
            type="button"
            onClick={() => {
              if (isMuted) {
                unmuteConversation();
              } else {
                setIsMuteDialogOpen(true);
              }
            }}
            disabled={isMutePending}
            aria-pressed={isMuted}
            className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl bg-[#121212] px-3 py-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isMuted ? (
              <Bell className="h-5 w-5 text-[#1d9bf0]" aria-hidden="true" />
            ) : (
              <BellOff className="h-5 w-5" aria-hidden="true" />
            )}
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>

        {muteStatus && (
          <p
            role="status"
            aria-live="polite"
            suppressHydrationWarning
            className="mt-3 text-center text-xs leading-5 text-gray-500"
          >
            {muteStatus}
          </p>
        )}
      </div>

      <MuteConversationDialog
        open={isMuteDialogOpen}
        isPending={isMutePending}
        onOpenChange={setIsMuteDialogOpen}
        onMute={muteConversation}
      />
    </>
  );
};
