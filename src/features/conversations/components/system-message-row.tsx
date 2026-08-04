import { format } from 'date-fns';
import { Users } from 'lucide-react';
import type { SystemMessage } from '../utils/system-message-presentation';
import { getSystemMessageText } from '../utils/system-message-presentation';

interface SystemMessageRowProps {
  message: SystemMessage;
  isHighlighted?: boolean;
}

export const SystemMessageRow = ({
  message,
  isHighlighted = false,
}: SystemMessageRowProps) => {
  const sentAt = new Date(message.send_at);
  const hasValidTimestamp = Number.isFinite(sentAt.getTime());
  const timeLabel = hasValidTimestamp ? format(sentAt, 'h:mm a') : '';
  const text = getSystemMessageText(message);

  return (
    <div
      data-message-id={message._id}
      tabIndex={-1}
      role="note"
      className={`mb-3 flex w-full justify-center rounded-xl px-4 py-2 text-center transition-colors duration-200 motion-reduce:transition-none ${
        isHighlighted ? 'bg-white/[0.06] ring-1 ring-white/40' : ''
      }`}
    >
      <div className="flex max-w-[32rem] items-center justify-center gap-2 text-xs text-gray-400">
        <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <p className="leading-5">{text}</p>
        {timeLabel && (
          <time dateTime={message.send_at} className="shrink-0 text-gray-500">
            {timeLabel}
          </time>
        )}
      </div>
    </div>
  );
};
