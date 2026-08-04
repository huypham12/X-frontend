import { cn } from '@/lib/utils';

interface CountBadgeProps {
  count?: number;
  isLoading?: boolean;
  className?: string;
}

const formatCount = (count: number) => (count >= 100 ? '99+' : count.toString());

export const CountBadge = ({
  count,
  isLoading = false,
  className,
}: CountBadgeProps) => {
  if (isLoading) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'absolute -right-2 -top-2 size-4 rounded-full bg-[#3f3f46] animate-pulse motion-reduce:animate-none',
          className,
        )}
      />
    );
  }

  if (count === undefined || count <= 0) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute -right-2.5 -top-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1d9bf0] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-black',
        className,
      )}
    >
      {formatCount(count)}
    </span>
  );
};
