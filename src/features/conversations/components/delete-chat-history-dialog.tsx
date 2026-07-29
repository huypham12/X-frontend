'use client';

import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteChatHistoryDialogProps {
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<boolean>;
}

export const DeleteChatHistoryDialog = ({
  open,
  isPending,
  onOpenChange,
  onDelete,
}: DeleteChatHistoryDialogProps) => {
  const handleDelete = async () => {
    const succeeded = await onDelete();
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
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-lg font-bold">Delete chat for you?</DialogTitle>
          <DialogDescription className="text-sm leading-5 text-gray-400">
            Your current chat history will be permanently removed from your account and cannot be
            recovered. Other people in this conversation will keep their history.
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
              void handleDelete();
            }}
            className="min-h-11 rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Deleting…' : 'Delete chat for me'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
