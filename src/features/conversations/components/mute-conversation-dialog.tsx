'use client';

import { BellOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MuteDurationHours } from '../types/conversation-action.type';

interface MuteConversationDialogProps {
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onMute: (durationHours?: MuteDurationHours) => Promise<boolean>;
}

const MUTE_OPTIONS: Array<{ label: string; description: string; durationHours?: MuteDurationHours }> = [
  { label: '1 hour', description: 'Notifications resume automatically in one hour.', durationHours: 1 },
  { label: '8 hours', description: 'Pause notifications for the rest of your day.', durationHours: 8 },
  { label: '24 hours', description: 'Pause notifications until this time tomorrow.', durationHours: 24 },
  { label: 'Until I turn it back on', description: 'Stay muted until you manually unmute.' },
];

export const MuteConversationDialog = ({
  open,
  isPending,
  onOpenChange,
  onMute,
}: MuteConversationDialogProps) => {
  const handleMute = async (durationHours?: MuteDurationHours) => {
    const succeeded = await onMute(durationHours);
    if (succeeded) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-md gap-0 overflow-hidden border border-[#2f3336] bg-[#121212] p-0 text-white shadow-2xl"
      >
        <DialogHeader className="border-b border-[#2f3336] px-5 py-5 pr-12">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#181818]">
            <BellOff className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-lg font-bold">Mute conversation</DialogTitle>
          <DialogDescription className="text-sm leading-5 text-gray-400">
            You will still receive messages, but notifications will be paused.
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-[#2f3336]">
          {MUTE_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              disabled={isPending}
              onClick={() => {
                void handleMute(option.durationHours);
              }}
              className="w-full px-5 py-4 text-left transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="block text-sm font-semibold text-white">{option.label}</span>
              <span className="mt-1 block text-xs leading-5 text-gray-500">{option.description}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
