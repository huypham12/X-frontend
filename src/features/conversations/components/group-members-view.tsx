'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { RotateCcw, ShieldCheck, UserMinus, UserPlus, UserRound, UsersRound } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import type { GroupConversation } from '../types';
import type { GroupMemberDetails } from '../types/group-member.type';
import { useGroupActions } from '../hooks/use-group-actions';
import { useGroupMembers } from '../hooks/use-group-members';
import { AddGroupMembersDialog } from './add-group-members-dialog';
import { RemoveGroupMemberDialog } from './remove-group-member-dialog';

interface GroupMembersViewProps {
  conversation: GroupConversation;
}

const GroupMembersSkeleton = () => (
  <div className="space-y-3" aria-label="Loading group members">
    {[0, 1, 2, 3].map((item) => (
      <div key={item} className="flex animate-pulse items-center gap-3 rounded-xl bg-[#121212] p-3 motion-reduce:animate-none">
        <div className="h-11 w-11 shrink-0 rounded-full bg-[#2f3336]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-[#2f3336]" />
          <div className="h-3 w-24 rounded bg-[#2f3336]" />
        </div>
      </div>
    ))}
  </div>
);

const formatJoinedDate = (joinedAt: string) => {
  const date = new Date(joinedAt);
  if (Number.isNaN(date.getTime())) return 'Join date unavailable';

  return `Joined ${new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date)}`;
};

export const GroupMembersView = ({ conversation }: GroupMembersViewProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<GroupMemberDetails>();
  const currentUserId = useAuthStore((state) => state.user?._id);
  const { data: members, isLoading, isError, refetch } = useGroupMembers(conversation._id);
  const {
    isAdmin,
    isAddMembersPending,
    isRemoveMemberPending,
    removingMemberId,
    addGroupMembers,
    removeGroupMember,
  } = useGroupActions(conversation);
  const sortedMembers = useMemo(
    () =>
      [...(members ?? [])].sort((first, second) => {
        if (first.role !== second.role) return first.role === 'admin' ? -1 : 1;
        return first.user.name.localeCompare(second.user.name);
      }),
    [members],
  );

  if (isLoading) {
    return (
      <div className="px-4 py-5">
        <GroupMembersSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
        <UsersRound className="h-8 w-8 text-gray-500" aria-hidden="true" />
        <p className="mt-3 text-sm text-gray-400">Could not load group members.</p>
        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#536471] px-4 py-2 text-sm font-semibold hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  if (sortedMembers.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
        <UsersRound className="h-8 w-8 text-gray-500" aria-hidden="true" />
        <p className="mt-3 text-sm text-gray-400">This group has no available members.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          {sortedMembers.length} {sortedMembers.length === 1 ? 'member' : 'members'}
        </p>
        <button
          type="button"
          onClick={() => setIsAddDialogOpen(true)}
          className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-black transition-colors duration-200 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>
      <ul className="space-y-2" aria-label="Group members">
        {sortedMembers.map((member) => {
          const identity = (
            <>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#181818] ring-1 ring-white/10">
                {member.user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-5 w-5 text-gray-500" aria-hidden="true" />
                )}
              </div>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-white">{member.user.name}</span>
                  {member.user._id === currentUserId && (
                    <span className="shrink-0 text-xs text-gray-500">(You)</span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-gray-500">
                  {member.user.username ? `@${member.user.username} · ` : ''}
                  {formatJoinedDate(member.joined_at)}
                </span>
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  member.role === 'admin'
                    ? 'bg-white text-black'
                    : 'bg-[#181818] text-gray-400'
                }`}
              >
                {member.role === 'admin' && <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}
                {member.role === 'admin' ? 'Admin' : 'Member'}
              </span>
            </>
          );

          return (
            <li key={member.user._id}>
              <div className="flex min-h-16 items-center gap-1 rounded-xl bg-[#121212] p-1">
                {member.user.username ? (
                  <Link
                    href={`/profile/${encodeURIComponent(member.user.username)}`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {identity}
                  </Link>
                ) : (
                  <div className="flex min-w-0 flex-1 items-center gap-3 p-2">{identity}</div>
                )}

                {isAdmin && member.user._id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => setMemberToRemove(member)}
                    disabled={isRemoveMemberPending}
                    aria-label={`Remove ${member.user.name} from the group`}
                    className="mr-1 shrink-0 rounded-full p-2 text-gray-500 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
                  >
                    <UserMinus
                      className={`h-4 w-4 ${
                        removingMemberId === member.user._id ? 'animate-pulse motion-reduce:animate-none' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {isAddDialogOpen && (
        <AddGroupMembersDialog
          currentMemberIds={sortedMembers.map((member) => member.user._id)}
          open={isAddDialogOpen}
          isPending={isAddMembersPending}
          onOpenChange={setIsAddDialogOpen}
          onAdd={addGroupMembers}
        />
      )}

      {memberToRemove && (
        <RemoveGroupMemberDialog
          member={memberToRemove}
          open
          isPending={isRemoveMemberPending}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setMemberToRemove(undefined);
          }}
          onRemove={removeGroupMember}
        />
      )}
    </div>
  );
};
