'use client';

import { useState } from 'react';
import { KeyRound, LogOut, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { GroupMemberDetails } from '../types/group-member.type';
import { AdminSuccessorPicker } from './admin-successor-picker';

interface LeaveGroupDialogProps {
  groupName: string;
  currentUserId?: string;
  members?: GroupMemberDetails[];
  isMembersLoading: boolean;
  isMembersError: boolean;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onRetryMembers: () => void;
  onLeave: () => Promise<boolean>;
  onTransferAndLeave: (successorUserId: string) => Promise<boolean>;
}

export const LeaveGroupDialog = ({
  groupName,
  currentUserId,
  members,
  isMembersLoading,
  isMembersError,
  open,
  isPending,
  onOpenChange,
  onRetryMembers,
  onLeave,
  onTransferAndLeave,
}: LeaveGroupDialogProps) => {
  const [selectedSuccessorId, setSelectedSuccessorId] = useState<string>();
  const currentMember = members?.find((member) => member.user._id === currentUserId);
  const eligibleSuccessors =
    members?.filter(
      (member) => member.user._id !== currentUserId && member.role === 'member',
    ) ?? [];
  const requiresTransfer = currentMember?.role === 'admin' && eligibleSuccessors.length > 0;
  const selectedSuccessorIsEligible = eligibleSuccessors.some(
    (member) => member.user._id === selectedSuccessorId,
  );
  const validSelectedSuccessorId = selectedSuccessorIsEligible
    ? selectedSuccessorId
    : undefined;
  const membershipUnavailable =
    isMembersError || (!isMembersLoading && (!members || !currentMember));
  const isConfirmDisabled =
    isPending ||
    isMembersLoading ||
    membershipUnavailable ||
    (requiresTransfer && !selectedSuccessorIsEligible);

  const handleConfirm = async () => {
    const succeeded =
      requiresTransfer && validSelectedSuccessorId
        ? await onTransferAndLeave(validSelectedSuccessorId)
        : await onLeave();
    if (succeeded) onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) return;
    if (!nextOpen) setSelectedSuccessorId(undefined);
    onOpenChange(nextOpen);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        showCloseButton={!isPending}
        className="flex max-h-[min(90dvh,680px)] max-w-md flex-col gap-0 overflow-hidden border border-[#2f3336] bg-[#121212] p-0 text-white shadow-2xl"
      >
        <DialogHeader className="shrink-0 border-b border-[#2f3336] px-5 py-5 pr-12">
          <div
            className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${
              requiresTransfer
                ? 'bg-[#1d9bf0]/10 text-[#1d9bf0]'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {requiresTransfer ? (
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            ) : (
              <LogOut className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
          <DialogTitle className="text-lg font-bold">
            {requiresTransfer ? 'Choose a new admin' : `Leave ${groupName}?`}
          </DialogTitle>
          <DialogDescription className="text-sm leading-5 text-gray-400">
            {requiresTransfer
              ? `You are the admin of ${groupName}. Transfer admin to one member before leaving.`
              : 'You will lose access to new messages and group activity. The group admin must add you again if you want to return.'}
          </DialogDescription>
        </DialogHeader>

        {isMembersLoading ? (
          <div className="space-y-2 px-5 py-5" aria-label="Loading group members">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="flex animate-pulse items-center gap-3 rounded-xl py-2 motion-reduce:animate-none"
              >
                <div className="h-10 w-10 rounded-full bg-[#2f3336]" />
                <div className="h-4 flex-1 rounded bg-[#2f3336]" />
              </div>
            ))}
          </div>
        ) : membershipUnavailable ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">Could not load the current group members.</p>
            <button
              type="button"
              onClick={onRetryMembers}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#536471] px-4 py-2 text-sm font-semibold hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : requiresTransfer ? (
          <AdminSuccessorPicker
            members={eligibleSuccessors}
            selectedMemberId={validSelectedSuccessorId}
            disabled={isPending}
            onSelect={setSelectedSuccessorId}
          />
        ) : null}

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#2f3336] px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
            className="min-h-11 rounded-full border border-[#536471] px-5 text-sm font-semibold hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isConfirmDisabled}
            onClick={() => void handleConfirm()}
            className="min-h-11 rounded-full bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50"
          >
            {isPending
              ? requiresTransfer
                ? 'Transferring…'
                : 'Leaving…'
              : requiresTransfer
                ? 'Transfer and leave'
                : 'Leave group'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
