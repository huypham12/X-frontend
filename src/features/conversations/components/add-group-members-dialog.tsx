'use client';

import { useState } from 'react';
import { Check, RotateCcw, Search, UserPlus, UserRound } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGroupMemberCandidates } from '../hooks/use-group-actions';

interface AddGroupMembersDialogProps {
  currentMemberIds: string[];
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (memberIds: string[]) => Promise<boolean>;
}

export const AddGroupMembersDialog = ({
  currentMemberIds,
  open,
  isPending,
  onOpenChange,
  onAdd,
}: AddGroupMembersDialogProps) => {
  const [keyword, setKeyword] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const {
    candidates,
    isLoading,
    isError,
    followingCount,
    refetch,
  } = useGroupMemberCandidates(keyword, currentMemberIds);

  const resetDialog = () => {
    setKeyword('');
    setSelectedMemberIds([]);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) return;
    if (!nextOpen) resetDialog();
    onOpenChange(nextOpen);
  };

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((currentIds) =>
      currentIds.includes(memberId)
        ? currentIds.filter((id) => id !== memberId)
        : [...new Set([...currentIds, memberId])],
    );
  };

  const handleAdd = async () => {
    const uniqueMemberIds = [...new Set(selectedMemberIds)].filter(
      (memberId) => !currentMemberIds.includes(memberId),
    );
    if (uniqueMemberIds.length === 0) return;

    const succeeded = await onAdd(uniqueMemberIds);
    if (succeeded) handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isPending}
        className="flex max-h-[min(90dvh,680px)] max-w-lg flex-col gap-0 overflow-hidden border border-[#2f3336] bg-[#121212] p-0 text-white shadow-2xl"
      >
        <DialogHeader className="shrink-0 border-b border-[#2f3336] px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#181818]">
              <UserPlus className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 pt-0.5">
              <DialogTitle className="text-lg font-bold">Add group members</DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-5 text-gray-400">
                Choose from people you follow who are not already in this group.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="shrink-0 border-b border-[#2f3336] px-5 py-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              disabled={isPending}
              placeholder="Search people you follow"
              aria-label="Search people to add to the group"
              autoFocus
              className="h-11 w-full rounded-full border border-[#2f3336] bg-black pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#536471] focus:ring-2 focus:ring-white disabled:opacity-50"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500" aria-live="polite">
            {selectedMemberIds.length === 0
              ? 'Select at least one person.'
              : `${selectedMemberIds.length} selected`}
          </p>
        </div>

        <div className="custom-scrollbar min-h-48 flex-1 overflow-y-auto px-3 py-3">
          {isLoading ? (
            <div className="space-y-2" aria-label="Loading people you follow">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center gap-3 rounded-xl px-3 py-2.5 motion-reduce:animate-none"
                >
                  <div className="h-10 w-10 rounded-full bg-[#2f3336]" />
                  <div className="h-4 flex-1 rounded bg-[#2f3336]" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400">Could not load people you follow.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#536471] px-4 py-2 text-sm font-semibold hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            </div>
          ) : candidates.length === 0 ? (
            <p className="px-3 py-12 text-center text-sm text-gray-500">
              {keyword.trim()
                ? 'No followed people match this search.'
                : followingCount === 0
                  ? 'You are not following anyone yet.'
                  : 'Everyone you follow is already in this group.'}
            </p>
          ) : (
            <div className="space-y-1" aria-label="People available to add">
              {candidates.map((candidate) => {
                const isSelected = selectedMemberIds.includes(candidate._id);

                return (
                  <button
                    key={candidate._id}
                    type="button"
                    onClick={() => toggleMember(candidate._id)}
                    disabled={isPending}
                    aria-pressed={isSelected}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2f3336]">
                      {candidate.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={candidate.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <UserRound className="h-5 w-5 text-gray-500" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{candidate.name}</span>
                      <span className="block truncate text-xs text-gray-500">
                        @{candidate.username}
                      </span>
                    </span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-[#1d9bf0] bg-[#1d9bf0] text-white'
                          : 'border-[#536471] text-transparent'
                      }`}
                      aria-hidden="true"
                    >
                      <Check className="h-4 w-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

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
            disabled={isPending || selectedMemberIds.length === 0}
            onClick={() => void handleAdd()}
            className="min-h-11 rounded-full bg-white px-5 text-sm font-bold text-black hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Adding…' : 'Add members'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
