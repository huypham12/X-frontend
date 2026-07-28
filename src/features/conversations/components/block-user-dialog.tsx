'use client';

import { Ban, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BlockUserDialogProps {
  open: boolean;
  isBlocked: boolean;
  isPending: boolean;
  partnerName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
}

export const BlockUserDialog = ({
  open,
  isBlocked,
  isPending,
  partnerName,
  onOpenChange,
  onConfirm,
}: BlockUserDialogProps) => {
  const handleConfirm = async () => {
    const succeeded = await onConfirm();
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
            {isBlocked ? (
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Ban className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
          <DialogTitle className="text-lg font-bold">
            {isBlocked ? `Unblock ${partnerName}?` : `Block ${partnerName}?`}
          </DialogTitle>
          <DialogDescription className="text-sm leading-5 text-gray-400">
            {isBlocked
              ? 'You can send direct messages again unless this person has also blocked you. Your existing message history stays unchanged.'
              : 'Neither of you will be able to send new direct messages. Your existing message history will not be deleted.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="min-h-11 rounded-full border border-[#536471] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => void handleConfirm()}
            className={`min-h-11 rounded-full px-5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              isBlocked
                ? 'bg-white text-black hover:bg-gray-200 focus-visible:ring-white'
                : 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-300'
            }`}
          >
            {isPending ? (isBlocked ? 'Unblocking…' : 'Blocking…') : isBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
