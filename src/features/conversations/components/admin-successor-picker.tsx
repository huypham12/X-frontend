'use client';

import { useMemo, useState } from 'react';
import { Check, Search, UserRound } from 'lucide-react';
import type { GroupMemberDetails } from '../types/group-member.type';

interface AdminSuccessorPickerProps {
  members: GroupMemberDetails[];
  selectedMemberId?: string;
  disabled: boolean;
  onSelect: (memberId: string) => void;
}

export const AdminSuccessorPicker = ({
  members,
  selectedMemberId,
  disabled,
  onSelect,
}: AdminSuccessorPickerProps) => {
  const [keyword, setKeyword] = useState('');
  const filteredMembers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return members;

    return members.filter(
      (member) =>
        member.user.name.toLowerCase().includes(normalizedKeyword) ||
        member.user.username?.toLowerCase().includes(normalizedKeyword),
    );
  }, [keyword, members]);

  return (
    <div className="min-h-0">
      <div className="border-b border-[#2f3336] px-5 py-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            disabled={disabled}
            placeholder="Search group members"
            aria-label="Search for the new group admin"
            className="h-11 w-full rounded-full border border-[#2f3336] bg-black pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#536471] focus:ring-2 focus:ring-white disabled:opacity-50"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500" aria-live="polite">
          {selectedMemberId ? 'New admin selected.' : 'Select one member to become the new admin.'}
        </p>
      </div>

      <div
        className="custom-scrollbar max-h-72 overflow-y-auto px-3 py-3"
        role="radiogroup"
        aria-label="Choose the new group admin"
      >
        {filteredMembers.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-gray-500">
            No group members match this search.
          </p>
        ) : (
          <div className="space-y-1">
            {filteredMembers.map((member) => {
              const isSelected = selectedMemberId === member.user._id;

              return (
                <label
                  key={member.user._id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 focus-within:ring-2 focus-within:ring-white ${
                    isSelected ? 'bg-[#1d9bf0]/10' : 'hover:bg-[#181818]'
                  } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <input
                    type="radio"
                    name="admin-successor"
                    value={member.user._id}
                    checked={isSelected}
                    onChange={() => onSelect(member.user._id)}
                    disabled={disabled}
                    className="sr-only"
                  />
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2f3336]">
                    {member.user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserRound className="h-5 w-5 text-gray-500" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">
                      {member.user.name}
                    </span>
                    {member.user.username && (
                      <span className="block truncate text-xs text-gray-500">
                        @{member.user.username}
                      </span>
                    )}
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
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
