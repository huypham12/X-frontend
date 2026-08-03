import { MessageCircle, Users } from 'lucide-react';
import type { NotificationTargetInfo } from '../types/notification.type';

interface NotificationTargetPreviewProps {
  target: NotificationTargetInfo | null;
  unavailableText: string;
}

export const NotificationTargetPreview = ({
  target,
  unavailableText,
}: NotificationTargetPreviewProps) => {
  if (!target) {
    return (
      <div className="mt-2 rounded-xl border border-[#2F3336] px-3 py-2 text-sm text-gray-500">
        {unavailableText}
      </div>
    );
  }

  if (target.target_type === 'TWEET' || target.target_type === 'MESSAGE') {
    return (
      <div className="mt-2 line-clamp-3 whitespace-pre-wrap break-words rounded-xl border border-[#2F3336] px-3 py-2 text-sm leading-5 text-gray-300">
        {target.content || unavailableText}
      </div>
    );
  }

  if (target.target_type === 'USER') {
    return (
      <div className="mt-2 rounded-xl border border-[#2F3336] px-3 py-2 text-sm text-gray-400">
        @{target.username}
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#2F3336] px-3 py-2 text-sm text-gray-400">
      {target.conversation_type === 'group' ? (
        <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span className="truncate">
        {target.name ||
          (target.conversation_type === 'group'
            ? 'Nhóm trò chuyện'
            : 'Cuộc trò chuyện')}
      </span>
    </div>
  );
};
