'use client';
import { useState } from 'react';
import { Home, Search, Bell, Mail, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { ProfileMenu } from '@/features/auth/components/profile-menu';
import { CreateTweetModal } from '@/features/tweets/components/create-tweet-modal';

export function Sidebar() {
  const pathname = usePathname();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Explore', href: '/explore', icon: Search },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Messages', href: '/messages', icon: Mail },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ];

  return (
    <>
      <aside className="w-[275px] shrink-0 border-r border-[#2F3336] hidden sm:flex flex-col p-4 min-h-screen sticky top-0">
      <div className="p-2 mb-2 hover:bg-[#181818] rounded-full w-fit cursor-pointer transition-colors">
        {/* X Logo SVG placeholder */}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="w-8 h-8 fill-white"><g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g></svg>
      </div>

      <nav className="flex-1 space-y-2 font-medium text-xl mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="group flex items-center">
              <div className="flex items-center gap-4 p-3 rounded-full group-hover:bg-[#181818] transition-colors w-fit">
                <Icon className={`w-7 h-7 ${isActive ? 'text-white' : 'text-white'}`} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? "currentColor" : "none"} />
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
