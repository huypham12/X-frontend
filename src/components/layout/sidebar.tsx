'use client';
import { useState } from 'react';
import { Bell, House, MessageCircle, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { ProfileMenu } from '@/features/auth/components/profile-menu';
import { CreateTweetModal } from '@/features/tweets/components/create-tweet-modal';

type SidebarIconName = 'home' | 'notifications' | 'messages' | 'profile';

const outlineIcons = {
  home: House,
  notifications: Bell,
  messages: MessageCircle,
  profile: UserRound,
} satisfies Record<SidebarIconName, typeof House>;

const filledIconPaths: Record<SidebarIconName, React.ReactNode> = {
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

function SidebarNavIcon({ name, active }: { name: SidebarIconName; active: boolean }) {
  if (!active) {
    const OutlineIcon = outlineIcons[name];
    return <OutlineIcon aria-hidden="true" className="size-7 shrink-0" strokeWidth={2} />;
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7 shrink-0 fill-current">
      {filledIconPaths[name]}
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: '/home', icon: 'home' },
    { name: 'Notifications', href: '/notifications', icon: 'notifications' },
    { name: 'Messages', href: '/messages', icon: 'messages' },
    { name: 'Profile', href: '/profile', icon: 'profile' },
  ] satisfies { name: string; href: string; icon: SidebarIconName }[];

  return (
    <>
      <aside className="w-[275px] shrink-0 border-r border-[#2F3336] hidden sm:flex flex-col p-4 h-screen sticky top-0 overflow-y-auto">
      <div className="p-2 mb-2 hover:bg-[#181818] rounded-full w-fit cursor-pointer transition-colors">
        {/* X Logo SVG placeholder */}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="w-8 h-8 fill-white"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
      </div>

      <nav className="flex-1 space-y-2 font-medium text-xl mt-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className="group flex items-center"
            >
              <div className="flex items-center gap-4 p-3 rounded-full group-hover:bg-[#181818] transition-colors w-fit">
                <SidebarNavIcon name={item.icon} active={isActive} />
                <span className={`${isActive ? 'font-bold' : ''}`}>{item.name}</span>
              </div>
            </Link>
          );
        })}

        <Button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          aria-haspopup="dialog"
          className="w-[90%] rounded-full h-14 font-bold text-lg mt-4 bg-[#1d9bf0] text-white hover:bg-[#1a8cd8]"
        >
          Post
        </Button>
      </nav>

      <ProfileMenu />
      </aside>

      <CreateTweetModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
}
