import { BookmarksFeed } from '@/features/tweets/components/bookmarks-feed';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bookmarks / X',
};

export default function BookmarksPage() {
  return (
    <div className="w-full flex">
      {/* Main Content */}
      <div className="w-full max-w-[600px] border-x border-[#2F3336] min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md">
          <div className="flex items-center px-4 h-[53px]">
            <div>
              <h1 className="text-xl font-bold">Bookmarks</h1>
              <div className="text-[13px] text-gray-500">@username</div>
            </div>
          </div>
        </div>

        {/* Feed */}
        <BookmarksFeed />
      </div>
    </div>
  );
}
