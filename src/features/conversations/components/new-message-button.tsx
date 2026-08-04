'use client';

import { useEffect, useState } from 'react';

interface NewMessageButtonProps {
  count: number;
  isRetry: boolean;
  onActivate: () => void;
}

export const NewMessageButton = ({
  count,
  isRetry,
  onActivate,
}: NewMessageButtonProps) => {
  const unit = count === 1 ? 'message' : 'messages';
  const label = `${isRetry ? 'Retry reading' : 'Go to'} ${count} new ${unit}`;
  const [announcedCount, setAnnouncedCount] = useState(count);

  useEffect(() => {
    const announcementTimeout = window.setTimeout(() => setAnnouncedCount(count), 300);
    return () => window.clearTimeout(announcementTimeout);
  }, [count]);

  const announcedUnit = announcedCount === 1 ? 'message' : 'messages';

  return (
    <>
      <span className="sr-only" aria-live="polite">
        {announcedCount} new {announcedUnit}
      </span>
      <button
        type="button"
        onClick={onActivate}
        aria-label={label}
        className="absolute bottom-4 left-1/2 z-[2] min-h-11 -translate-x-1/2 rounded-full bg-[#1d9bf0] px-4 text-sm font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-[#1a8cd8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none"
      >
        {isRetry ? 'Retry new messages' : 'New messages'}
        {count > 1 ? ` (${count})` : ''}
      </button>
    </>
  );
};
