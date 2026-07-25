'use client';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

import { SearchBar } from '@/features/search/components/search-bar';

export function RightSidebar() {
  return (
    <aside className="w-[350px] shrink-0 hidden lg:flex flex-col p-4 sticky top-0 h-screen space-y-4">
      <div className="sticky top-0 bg-black pt-1 pb-2 z-10">
        <SearchBar />
      </div>

      <div className="bg-[#16181c] rounded-2xl flex flex-col pt-3 pb-1 border border-[#16181c]">
        <h2 className="font-bold text-xl px-4 mb-4">Subscribe to Premium</h2>
        <p className="text-sm px-4 mb-4">Subscribe to unlock new features and if eligible, receive a share of ads revenue.</p>
        <div className="px-4 mb-3">
          <Button className="rounded-full font-bold bg-[#1d9bf0] text-white hover:bg-[#1a8cd8]">Subscribe</Button>
        </div>
      </div>

      <div className="bg-[#16181c] rounded-2xl flex flex-col pt-3 border border-[#16181c]">
        <h2 className="font-bold text-xl px-4 mb-4">Trends for you</h2>
        {[1,2,3].map((i) => (
          <div key={i} className="hover:bg-white/5 cursor-pointer px-4 py-3 transition-colors">
            <div className="text-sm text-gray-500 flex justify-between">
              <span>Trending in Vietnam</span>
              <span className="cursor-pointer hover:text-[#1d9bf0]">...</span>
            </div>
            <div className="font-bold mt-1">#Nextjs15</div>
            <div className="text-sm text-gray-500 mt-1">12.5K posts</div>
          </div>
        ))}
        <div className="hover:bg-white/5 cursor-pointer px-4 py-4 rounded-b-2xl transition-colors text-[#1d9bf0]">
          Show more
        </div>
      </div>
    </aside>
  );
}
