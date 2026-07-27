'use client';
import { SearchBar } from '@/features/search/components/search-bar';
import { WhoToFollow } from '@/features/users/components/who-to-follow';
import { OnlineFriends } from '@/features/users/components/online-friends';
import { ConversationSidebar } from '@/features/conversations/components/conversation-sidebar';
import { usePathname } from 'next/navigation';

export function RightSidebar() {
  const pathname = usePathname();
  const isMessagesPage = pathname.startsWith('/messages');

  if (isMessagesPage) {
    return (
      <aside className="w-[350px] shrink-0 hidden lg:flex flex-col h-screen sticky top-0">
        <ConversationSidebar />
      </aside>
    );
  }

  return (
    <aside className="w-[350px] shrink-0 hidden lg:flex flex-col p-4 sticky top-0 h-screen space-y-4 overflow-y-auto">
      <div className="sticky top-0 bg-black pt-1 pb-2 z-10">
        <SearchBar />
      </div>

      <OnlineFriends />
      <WhoToFollow />
    </aside>
  );
}
