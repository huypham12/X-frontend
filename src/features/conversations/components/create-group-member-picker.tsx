'use client';

import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import type { Friend } from '@/features/users/types/user.type';
import { useGroupMemberCandidates } from '../hooks/use-create-group-conversation';

interface CreateGroupMemberPickerProps {
  partnerId: string;
  selectedMemberIds: string[];
  disabled: boolean;
  onChange: (memberIds: string[]) => void;
}

const MemberRow = ({
  member,
  selected,
  disabled,
  onToggle,
}: {
  member: Friend;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={disabled}
    aria-pressed={selected}
    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
  >
    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#2f3336]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={member.avatar || '/default-avatar.png'}
        alt=""
        className="h-full w-full object-cover"
      />
    </div>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold text-white">{member.name}</span>
      <span className="block truncate text-xs text-gray-500">@{member.username}</span>
    </span>
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
        selected ? 'border-[#1d9bf0] bg-[#1d9bf0] text-white' : 'border-[#536471] text-transparent'
      }`}
      aria-hidden="true"
    >
      <Check className="h-4 w-4" />
    </span>
  </button>
);

export const CreateGroupMemberPicker = ({
  partnerId,
  selectedMemberIds,
  disabled,
  onChange,
}: CreateGroupMemberPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { candidates, isLoading, isError, refetch } = useGroupMemberCandidates(partnerId);
  const filteredCandidates = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return candidates;
    return candidates.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(normalizedQuery) ||
        candidate.username.toLowerCase().includes(normalizedQuery),
    );
  }, [candidates, searchQuery]);

  const toggleMember = (memberId: string) => {
    const nextMemberIds = selectedMemberIds.includes(memberId)
      ? selectedMemberIds.filter((id) => id !== memberId)
      : [...new Set([...selectedMemberIds, memberId])];
    onChange(nextMemberIds);
  };

  return (
    <>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          disabled={disabled}
          placeholder="Search people you follow"
          aria-label="Search people to add"
          className="h-10 w-full rounded-full bg-[#181818] pl-10 pr-3 text-sm text-white outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div
        className="custom-scrollbar min-h-14 max-h-40 space-y-1 overflow-y-auto"
        aria-label="People available to add"
      >
        {isLoading ? (
          [0, 1, 2].map((item) => (
            <div
              key={item}
              className="flex animate-pulse items-center gap-3 px-3 py-2.5 motion-reduce:animate-none"
            >
              <div className="h-10 w-10 rounded-full bg-[#181818]" />
              <div className="h-4 flex-1 rounded bg-[#181818]" />
            </div>
          ))
        ) : isError ? (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-400">Could not load people you follow.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-3 text-sm font-semibold text-white underline underline-offset-4"
            >
              Retry
            </button>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">No available people found.</p>
        ) : (
          filteredCandidates.map((candidate) => (
            <MemberRow
              key={candidate._id}
              member={candidate}
              selected={selectedMemberIds.includes(candidate._id)}
              disabled={disabled}
              onToggle={() => toggleMember(candidate._id)}
            />
          ))
        )}
      </div>
    </>
  );
};
