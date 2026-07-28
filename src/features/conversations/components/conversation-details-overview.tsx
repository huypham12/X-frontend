'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell, BellOff, EyeOff, Images, LogOut, Pencil, Pin, PinOff, Search, UserPlus, UserRound, UsersRound } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { FriendPresenceDot } from '@/features/users/components/friend-presence-dot';
import type { Conversation, GroupConversation } from '../types';
import { useConversationActions } from '../hooks/use-conversation-actions';
import { MuteConversationDialog } from './mute-conversation-dialog';
import { useConversationDetailsStore } from '../stores/conversation-details.store';
import { CreateGroupWithPartnerDialog } from './create-group-with-partner-dialog';
import { HideConversationDialog } from './hide-conversation-dialog';
import { ConversationBlockAction } from './conversation-block-action';
import { EditGroupDialog } from './edit-group-dialog';
import { isCurrentUserGroupAdmin, useGroupActions } from '../hooks/use-group-actions';
import { LeaveGroupDialog } from './leave-group-dialog';

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

const GroupLeaveAction = ({ conversation }: { conversation: GroupConversation }) => {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const { isLeaveGroupPending, leaveGroup } = useGroupActions(conversation);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsLeaveDialogOpen(true)}
        disabled={isLeaveGroupPending}
        className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#121212] px-3 py-3 text-sm font-semibold text-red-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
      >
        <LogOut className="h-5 w-5" aria-hidden="true" />
        Leave group
      </button>

      {isLeaveDialogOpen && (
        <LeaveGroupDialog
          groupName={conversation.name}
          open={isLeaveDialogOpen}
          isPending={isLeaveGroupPending}
          onOpenChange={setIsLeaveDialogOpen}
          onLeave={leaveGroup}
        />
      )}
    </>
  );
};

export const ConversationDetailsOverview = ({
  conversation,
  isPartnerOnline,
}: ConversationDetailsOverviewProps) => {
  const [isMuteDialogOpen, setIsMuteDialogOpen] = useState(false);
  const [isHideDialogOpen, setIsHideDialogOpen] = useState(false);
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const currentUserId = useAuthStore((state) => state.user?._id);
  const openView = useConversationDetailsStore((state) => state.openView);
  const isDirect = conversation.type === 'direct';
  const name = isDirect
    ? conversation.partner_info?.name || 'Unknown user'
    : conversation.name || 'Group chat';
  const avatar = isDirect ? conversation.partner_info?.avatar : conversation.avatar_url;
  const isGroupAdmin =
    conversation.type === 'group' && isCurrentUserGroupAdmin(conversation, currentUserId);
  const {
    isMuted,
    mutedUntil,
    isPinPending,
    isMutePending,
    isHidePending,
    togglePin,
    muteConversation,
    unmuteConversation,
    hideConversation,
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
      <div className="border-b border-[#2f3336] px-5 py-5">
        <div className="flex items-center gap-4 text-left">
          <div className="relative shrink-0">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#181818] text-xl font-semibold text-white ring-1 ring-white/10">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : isDirect ? (
                <UserRound className="h-7 w-7 text-gray-400" aria-hidden="true" />
              ) : (
                <UsersRound className="h-7 w-7 text-gray-400" aria-hidden="true" />
              )}
              {!avatar && <span className="sr-only">{getInitials(name)}</span>}
            </div>
            {isDirect && (
              <FriendPresenceDot
                isOnline={isPartnerOnline}
                showOffline
                className="h-4 w-4 border-[3px]"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {isDirect ? (
              <>
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                  <h3 className="max-w-full truncate text-lg font-bold text-white">{name}</h3>
                  {conversation.partner_info?.username && (
                    <span className="max-w-full truncate text-sm text-gray-500">
                      @{conversation.partner_info.username}
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm">
                  <span className="text-gray-400">
                    {isPartnerOnline ? 'Online now' : 'Offline'}
                  </span>
                  {conversation.partner_info?.username && (
                    <>
                      <span className="text-gray-600" aria-hidden="true">
                        ·
                      </span>
                      <Link
                        href={`/profile/${encodeURIComponent(conversation.partner_info.username)}`}
                        className="font-semibold text-white underline-offset-4 transition-colors duration-200 hover:text-gray-300 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        View profile
                      </Link>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="truncate text-lg font-bold text-white">{name}</h3>
                <p className="mt-1 text-sm text-gray-400">
                  {conversation.members.length} {conversation.members.length === 1 ? 'member' : 'members'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-[#2f3336] px-6 py-5">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => openView('search')}
            className="flex min-h-16 flex-col items-center justify-center gap-2 rounded-xl bg-[#121212] px-3 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
            Search
          </button>

          <button
            type="button"
            onClick={() => openView('media')}
            className="flex min-h-16 flex-col items-center justify-center gap-2 rounded-xl bg-[#121212] px-3 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Images className="h-5 w-5" aria-hidden="true" />
            Media
          </button>

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

          {conversation.type === 'direct' && (
            <>
              <button
                type="button"
                onClick={() => setIsCreateGroupDialogOpen(true)}
                className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#121212] px-3 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <UserPlus className="h-5 w-5" aria-hidden="true" />
                Create group with {name}
              </button>

              <ConversationBlockAction
                partnerName={name}
                username={conversation.partner_info?.username}
              />
            </>
          )}

          {conversation.type === 'group' && (
            <>
              <button
                type="button"
                onClick={() => openView('members')}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#121212] px-3 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  isGroupAdmin ? '' : 'col-span-2'
                }`}
              >
                <UsersRound className="h-5 w-5" aria-hidden="true" />
                Members
              </button>

              {isGroupAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEditGroupDialogOpen(true)}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#121212] px-3 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Pencil className="h-5 w-5" aria-hidden="true" />
                  Edit group
                </button>
              )}

              <GroupLeaveAction conversation={conversation} />
            </>
          )}

          <button
            type="button"
            onClick={() => setIsHideDialogOpen(true)}
            disabled={isHidePending}
            className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#121212] px-3 py-3 text-sm font-semibold text-red-400 transition-colors duration-200 hover:bg-[#181818] hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <EyeOff className="h-5 w-5" aria-hidden="true" />
            Hide from inbox
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

      <HideConversationDialog
        open={isHideDialogOpen}
        isPending={isHidePending}
        onOpenChange={setIsHideDialogOpen}
        onHide={hideConversation}
      />

      {conversation.type === 'direct' && (
        <CreateGroupWithPartnerDialog
          open={isCreateGroupDialogOpen}
          onOpenChange={setIsCreateGroupDialogOpen}
          partner={{
            _id: conversation.partner_id,
            name,
            username: conversation.partner_info?.username,
            avatar: conversation.partner_info?.avatar,
          }}
        />
      )}

      {isEditGroupDialogOpen && conversation.type === 'group' && (
        <EditGroupDialog
          conversation={conversation}
          open={isEditGroupDialogOpen}
          onOpenChange={setIsEditGroupDialogOpen}
        />
      )}
    </>
  );
};
