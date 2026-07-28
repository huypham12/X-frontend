'use client';

import { EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HideConversationDialogProps {
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onHide: () => Promise<boolean>;
}

export const HideConversationDialog = ({
  open,
  isPending,
  onOpenChange,
  onHide,
}: HideConversationDialogProps) => {
  const handleHide = async () => {
    const succeeded = await onHide();
    if (succeeded) {
      onOpenChange(false);
    }
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
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-lg font-bold">Hide conversation?</DialogTitle>
          <DialogDescription className="text-sm leading-5 text-gray-400">
            This removes the conversation only from your inbox and does not delete anyone&apos;s
            message history. New messages will not restore it; find the person or group in inbox
            search when you want to open it again.
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
            onClick={() => {
              void handleHide();
            }}
            className="min-h-11 rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Hiding…' : 'Hide from inbox'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
