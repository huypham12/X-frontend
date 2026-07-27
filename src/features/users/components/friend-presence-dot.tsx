interface FriendPresenceDotProps {
  isOnline: boolean;
  showOffline?: boolean;
  className?: string;
}

export function FriendPresenceDot({
  isOnline,
  showOffline = false,
  className = '',
}: FriendPresenceDotProps) {
  if (!isOnline && !showOffline) return null;

  return (
    <span
      role="status"
      aria-label={isOnline ? 'Online' : 'Offline'}
      title={isOnline ? 'Online' : 'Offline'}
      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black ${
        isOnline ? 'bg-emerald-500' : 'bg-gray-500'
      } ${className}`}
    />
  );
}
