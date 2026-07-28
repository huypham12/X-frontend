'use client';

import { useState } from 'react';
import { Ban, RotateCcw, ShieldCheck } from 'lucide-react';
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
        className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#121212] px-3 py-3 text-sm font-semibold text-red-400 transition-colors duration-200 hover:bg-[#181818] hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isError ? (
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        ) : isBlocked ? (
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Ban className="h-5 w-5" aria-hidden="true" />
        )}
        {isLoading || isFetching ? 'Checking block status…' : isError ? 'Retry block status' : isBlocked ? 'Unblock user' : 'Block user'}
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
