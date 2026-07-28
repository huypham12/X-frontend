'use client';

import { LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LeaveGroupDialogProps {
  groupName: string;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onLeave: () => Promise<boolean>;
}

export const LeaveGroupDialog = ({
  groupName,
  open,
  isPending,
  onOpenChange,
  onLeave,
}: LeaveGroupDialogProps) => {
  const handleLeave = async () => {
    const succeeded = await onLeave();
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
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-lg font-bold">Leave {groupName}?</DialogTitle>
          <DialogDescription className="text-sm leading-5 text-gray-400">
            You will lose access to new messages and will no longer be able to send messages in
            this group. A group admin must add you again if you want to return.
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
            onClick={() => void handleLeave()}
            className="min-h-11 rounded-full bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50"
          >
            {isPending ? 'Leaving…' : 'Leave group'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
