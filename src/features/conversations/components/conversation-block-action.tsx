'use client';

import { useState } from 'react';
import { Ban, ChevronRight, RotateCcw, ShieldCheck } from 'lucide-react';
import { useConversationPartnerBlockAction } from '../hooks/use-conversation-partner-profile';
import { BlockUserDialog } from './block-user-dialog';

interface ConversationBlockActionProps {
  partnerName: string;
  username?: string;
}

export const ConversationBlockAction = ({
  partnerName,
  username,
}: ConversationBlockActionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    data: profile,
    isLoading,
    isFetching,
    isError,
    refetch,
    isBlockPending,
    setBlocked,
  } = useConversationPartnerBlockAction(username);
  const isBlocked = Boolean(profile?.is_blocked);
  const isUnavailable = !username || (!profile && !isLoading && !isError);

  if (!username) return null;

  return (
    <>
      <button
        type="button"
        disabled={isLoading || isFetching || isBlockPending || isUnavailable}
        aria-pressed={isBlocked}
        onClick={() => {
          if (isError) {
            void refetch();
          } else {
            setIsDialogOpen(true);
          }
        }}
        className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-red-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isError ? (
          <RotateCcw className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        ) : isBlocked ? (
          <ShieldCheck className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        ) : (
          <Ban className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        )}
        <span className="min-w-0 flex-1 truncate">
          {isLoading || isFetching ? 'Checking block status…' : isError ? 'Retry block status' : isBlocked ? 'Unblock user' : 'Block user'}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-red-400/70" aria-hidden="true" />
      </button>

      <BlockUserDialog
        open={isDialogOpen}
        isBlocked={isBlocked}
        isPending={isBlockPending}
        partnerName={partnerName}
        onOpenChange={setIsDialogOpen}
        onConfirm={() => setBlocked(!isBlocked)}
      />
    </>
  );
};
