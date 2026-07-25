'use client';
import { useState } from 'react';
import { HomeFeed } from '@/features/tweets/components/home-feed';
import { CreateTweet } from '@/features/tweets/components/create-tweet';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');

  return (
    <div className="flex flex-col min-h-screen border-r border-[#2F3336]">
      {/* Header Tabs */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 flex border-b border-[#2F3336]">
        <button
          onClick={() => setActiveTab('for-you')}
          className="flex-1 hover:bg-white/5 transition-colors font-bold text-center h-[53px] relative flex flex-col justify-center items-center outline-none"
        >
          <span className={activeTab === 'for-you' ? 'text-white' : 'text-gray-500 font-medium'}>For you</span>
          {activeTab === 'for-you' && (
            <div className="absolute bottom-0 w-16 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className="flex-1 hover:bg-white/5 transition-colors font-bold text-center h-[53px] relative flex flex-col justify-center items-center outline-none"
        >
          <span className={activeTab === 'following' ? 'text-white' : 'text-gray-500 font-medium'}>Following</span>
          {activeTab === 'following' && (
            <div className="absolute bottom-0 w-20 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>
      </div>

      {/* Create Tweet Form */}
      <CreateTweet />

      {/* Feed */}
      <HomeFeed type={activeTab} />
    </div>
  );
}
