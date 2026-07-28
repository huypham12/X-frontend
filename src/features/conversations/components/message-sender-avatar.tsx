'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import type { UserPreview } from '../types';

interface MessageSenderAvatarProps {
  messageId: string;
  sender: UserPreview | null;
}

const getInitials = (name: string) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return initials || '?';
};

export const MessageSenderAvatar = ({ messageId, sender }: MessageSenderAvatarProps) => {
  const tooltipId = `${useId()}-${messageId}`;
  const [imageFailed, setImageFailed] = useState(false);
  const displayName = sender?.name.trim() || 'Unknown sender';
  const showImage = Boolean(sender?.avatar) && !imageFailed;

  return (
    <div className="group relative flex h-8 w-8 items-center justify-center">
      <button
        type="button"
        aria-label={`Message sender: ${displayName}`}
        aria-describedby={tooltipId}
        className="relative h-8 w-8 overflow-hidden rounded-full bg-[#2f3336] text-[11px] font-semibold text-white ring-offset-black transition-[filter,box-shadow] duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 motion-reduce:transition-none"
      >
        {showImage && sender?.avatar ? (
          <Image
            src={sender.avatar}
            alt=""
            fill
            sizes="32px"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span aria-hidden="true">{getInitials(displayName)}</span>
        )}
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 max-w-48 -translate-y-1 whitespace-nowrap rounded-md border border-[#2f3336] bg-[#181818] px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none"
      >
        {displayName}
      </span>
    </div>
  );
};
