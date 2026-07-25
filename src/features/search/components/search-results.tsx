'use client';
import { useState, useEffect } from 'react';
import { SearchUsersList } from './search-users-list';
import { SearchTweetsList } from './search-tweets-list';

type SearchTab = 'top' | 'people';

export function SearchResults({ query, filter }: { query: string, filter?: string }) {
  const [activeTab, setActiveTab] = useState<SearchTab>((filter as SearchTab) || 'top');

  useEffect(() => {
    if (filter === 'people') {
      setActiveTab('people');
    } else {
      setActiveTab('top');
    }
  }, [filter]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Tabs */}
      <div className="flex border-b border-[#2F3336] sticky top-0 bg-black/80 backdrop-blur-md z-10 pt-2">
        <button
          onClick={() => setActiveTab('top')}
          className="flex-1 hover:bg-white/5 transition-colors font-bold text-center h-[53px] relative flex flex-col justify-center items-center"
        >
          <span className={activeTab === 'top' ? 'text-white' : 'text-gray-500 font-medium'}>Top</span>
          {activeTab === 'top' && (
            <div className="absolute bottom-0 w-12 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('people')}
          className="flex-1 hover:bg-white/5 transition-colors font-bold text-center h-[53px] relative flex flex-col justify-center items-center"
        >
          <span className={activeTab === 'people' ? 'text-white' : 'text-gray-500 font-medium'}>People</span>
          {activeTab === 'people' && (
            <div className="absolute bottom-0 w-16 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'people' ? (
          <SearchUsersList query={query} />
        ) : (
          <SearchTweetsList query={query} />
        )}
      </div>
    </div>
  );
}
