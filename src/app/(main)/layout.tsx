import { Sidebar } from '@/components/layout/sidebar';
import { RightSidebar } from '@/components/layout/right-sidebar';
import { VerifyEmailBanner } from '@/features/auth/components/verify-email-banner';
import { FriendPresenceProvider } from '@/features/users/providers/friend-presence-provider';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <FriendPresenceProvider>
      <VerifyEmailBanner />
      <div className="min-h-screen bg-black text-white flex justify-center">
        <div className="flex w-full max-w-7xl justify-between">
          <Sidebar />
          
          <main className="min-h-screen max-w-[600px] flex-1 border-x border-[#2F3336] pb-[calc(4rem+env(safe-area-inset-bottom))] pt-[40px] sm:pb-0 lg:pt-0">
            {children}
          </main>
          
          <RightSidebar />
        </div>
      </div>
    </FriendPresenceProvider>
  );
}
