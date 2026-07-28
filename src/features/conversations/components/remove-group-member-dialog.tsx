'use client';

import { UserMinus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { GroupMemberDetails } from '../types/group-member.type';

interface RemoveGroupMemberDialogProps {
  member: GroupMemberDetails;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (memberId: string) => Promise<boolean>;
}

export const RemoveGroupMemberDialog = ({
  member,
  open,
  isPending,
  onOpenChange,
  onRemove,
}: RemoveGroupMemberDialogProps) => {
  const handleRemove = async () => {
    const succeeded = await onRemove(member.user._id);
    if (succeeded) onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={!isPending}
        className="max-w-md gap-0 overflow-hidden border border-[#2f3336] bg-[#121212] p-0 text-white shadow-2xl"
      >
        <DialogHeader className="border-b border-[#2f3336] px-5 py-5 pr-12">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <UserMinus className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-lg font-bold">Remove {member.user.name}?</DialogTitle>
          <DialogDescription className="text-sm leading-5 text-gray-400">
            They will immediately lose access to new messages and group activity. You can add them
            again later.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="min-h-11 rounded-full border border-[#536471] px-5 text-sm font-semibold hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => void handleRemove()}
            className="min-h-11 rounded-full bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50"
          >
            {isPending ? 'Removing…' : 'Remove member'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
