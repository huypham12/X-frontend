import { Bell, House, MessageCircle, UserRound } from 'lucide-react';
import Link from 'next/link';
import { CountBadge } from '../ui/count-badge';

type NavigationIconName = 'home' | 'notifications' | 'messages' | 'profile';
type NavigationMode = 'desktop' | 'mobile';

export type BadgeKind = 'notifications' | 'messages';

export interface BadgeViewState {
  count?: number;
  isInitialLoading: boolean;
  isSyncing: boolean;
  isUnavailable: boolean;
  hasCachedError: boolean;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: NavigationIconName;
  badge?: BadgeKind;
}

const navigationItems: NavigationItem[] = [
  { name: 'Home', href: '/home', icon: 'home' },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: 'notifications',
    badge: 'notifications',
  },
  { name: 'Messages', href: '/messages', icon: 'messages', badge: 'messages' },
  { name: 'Profile', href: '/profile', icon: 'profile' },
];

const outlineIcons = {
  home: House,
  notifications: Bell,
  messages: MessageCircle,
  profile: UserRound,
} satisfies Record<NavigationIconName, typeof House>;

const filledIconPaths: Record<NavigationIconName, React.ReactNode> = {
  home: (
    <path
      fillRule="evenodd"
      d="M12.67 1.61a1.15 1.15 0 0 0-1.34 0L2.45 8.01A1.1 1.1 0 0 0 2 8.9v10.85A2.25 2.25 0 0 0 4.25 22h15.5A2.25 2.25 0 0 0 22 19.75V8.9a1.1 1.1 0 0 0-.45-.89l-8.88-6.4ZM10 22v-7h4v7h-4Z"
      clipRule="evenodd"
    />
  ),
  notifications: (
    <>
      <path d="M12 2a6.25 6.25 0 0 0-6.25 6.25v3.2c0 1.43-.42 2.83-1.2 4.03l-1.03 1.57A1.25 1.25 0 0 0 4.57 19h14.86a1.25 1.25 0 0 0 1.05-1.95l-1.03-1.57a7.4 7.4 0 0 1-1.2-4.03v-3.2A6.25 6.25 0 0 0 12 2Z" />
      <path d="M9.35 20.25a2.8 2.8 0 0 0 5.3 0h-5.3Z" />
    </>
  ),
  messages: (
    <path d="M12 2C6.48 2 2 6.04 2 11.03c0 2.36 1 4.51 2.65 6.12l-.72 3.24a.75.75 0 0 0 .91.88l3.6-.91c1.1.44 2.3.68 3.56.68 5.52 0 10-4.04 10-9.01C22 6.04 17.52 2 12 2Z" />
  ),
  profile: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0v1h-15v-1Z" />
    </>
  ),
};

const getBadgeLabel = (item: NavigationItem, state: BadgeViewState | undefined) => {
  if (!item.badge || !state) return item.name;
  if (state.isInitialLoading) return `${item.name}, unread count loading`;
  if (state.isUnavailable) return `${item.name}, unread count unavailable`;

  const count = state.count ?? 0;
  const unreadDescription =
    count === 0
      ? item.badge === 'notifications'
        ? 'no unread notifications'
        : 'no unread conversations'
      : `${count} unread ${item.badge === 'notifications' ? 'notification' : 'conversation'}${count === 1 ? '' : 's'}`;
  const syncDescription = state.isSyncing ? ', syncing' : '';
  const errorDescription = state.hasCachedError ? ', status may be out of date' : '';
  return `${item.name}, ${unreadDescription}${syncDescription}${errorDescription}`;
};

const NavigationIcon = ({ name, active }: { name: NavigationIconName; active: boolean }) => {
  if (!active) {
    const OutlineIcon = outlineIcons[name];
    return <OutlineIcon aria-hidden="true" className="size-7 shrink-0" strokeWidth={2} />;
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7 shrink-0 fill-current">
      {filledIconPaths[name]}
    </svg>
  );
};

export const PrimaryNavigationLinks = ({
  pathname,
  mode,
  badges,
}: {
  pathname: string;
  mode: NavigationMode;
  badges: Record<BadgeKind, BadgeViewState>;
}) =>
  navigationItems.map((item) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const badgeState = item.badge ? badges[item.badge] : undefined;

    return (
      <Link
        key={item.name}
        href={item.href}
        aria-label={getBadgeLabel(item, badgeState)}
        aria-current={isActive ? 'page' : undefined}
        title={
          badgeState?.isUnavailable
            ? `${item.name} unread count unavailable`
            : badgeState?.hasCachedError
              ? `${item.name} unread count may be out of date`
              : undefined
        }
        className={
          mode === 'desktop'
            ? 'group flex min-h-11 w-fit items-center rounded-full p-3 transition-colors hover:bg-[#181818] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none'
            : 'group flex min-h-11 min-w-11 flex-1 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white'
        }
      >
        <span
          className={
            mode === 'desktop'
              ? 'flex items-center gap-4'
              : 'relative flex min-h-11 min-w-11 items-center justify-center rounded-xl transition-colors group-hover:bg-[#181818] motion-reduce:transition-none'
          }
        >
          <span className="relative">
            <NavigationIcon name={item.icon} active={isActive} />
            {badgeState ? (
              <CountBadge
                count={badgeState.count}
                isLoading={badgeState.isInitialLoading}
                isSyncing={badgeState.isSyncing}
              />
            ) : null}
          </span>
          <span className={mode === 'desktop' ? (isActive ? 'font-bold' : '') : 'sr-only'}>
            {item.name}
          </span>
        </span>
      </Link>
    );
  });

export const ReconnectStatus = ({ mobile }: { mobile?: boolean }) => (
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className={
      mobile
        ? 'absolute -top-8 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[#2f3336] bg-black px-3 py-1 text-xs text-[#a1a1aa]'
        : 'mt-3 flex items-center gap-2 px-3 text-xs font-normal text-[#a1a1aa]'
    }
  >
    <span
      aria-hidden="true"
      className="size-1.5 rounded-full bg-[#a1a1aa] animate-pulse motion-reduce:animate-none"
    />
    Reconnecting…
  </div>
);
