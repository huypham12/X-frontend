import type { MessageReplyPreview as MessageReplyPreviewType } from '../types';

interface MessageReplyPreviewProps {
  reply: MessageReplyPreviewType | null;
  targetMessageId: string;
  variant: 'bubble' | 'composer';
  onOpenTarget?: (messageId: string) => void;
}

const MEDIA_LABELS = {
  image: 'Photo',
  video: 'Video',
  audio: 'Audio',
} as const;

export const MessageReplyPreview = ({
  reply,
  targetMessageId,
  variant,
  onOpenTarget,
}: MessageReplyPreviewProps) => {
  const isUnavailable = !reply || reply.status === 'revoked';
  const senderName = reply?.sender_info?.name.trim() || 'Unknown sender';
  const summary = isUnavailable
    ? 'Message unavailable'
    : reply.content.trim() || (reply.media_type ? MEDIA_LABELS[reply.media_type] : 'Message');
  const className = `min-w-0 w-full rounded-lg border-l-2 border-[#1d9bf0] px-3 py-2 text-left ${
    variant === 'composer' ? 'bg-[#181818]' : 'bg-black/20'
  }`;
  const content = (
    <>
      <span className="block truncate text-xs font-semibold text-white">
        {isUnavailable ? 'Original message' : senderName}
      </span>
      <span className="mt-0.5 block truncate text-xs text-gray-400">{summary}</span>
    </>
  );

  if (isUnavailable || !onOpenTarget) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onOpenTarget(targetMessageId)}
      aria-label={`Open replied message from ${senderName}`}
      className={`${className} transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none`}
    >
      {content}
    </button>
  );
};
