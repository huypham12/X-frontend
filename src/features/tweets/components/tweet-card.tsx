'use client';
import { MessageCircle, Repeat2, Heart, BarChart2, Share, MoreHorizontal } from 'lucide-react';

export function TweetCard({ tweet }: { tweet: any }) {
  return (
    <div className="border-b border-[#2F3336] p-4 flex gap-4 hover:bg-white/5 transition-colors cursor-pointer">
      <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold hover:underline truncate max-w-[120px] sm:max-w-none">
              {tweet.user?.name || 'User'}
            </span>
            <span className="text-gray-500 truncate max-w-[100px] sm:max-w-none">
              @{tweet.user?.username || 'username'}
            </span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500 text-sm hover:underline">
              2h
            </span>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 group transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-500 group-hover:text-[#1d9bf0]" />
          </div>
        </div>
        
        <div className="mt-1 text-[15px] whitespace-pre-wrap">
          {tweet.content || 'This is a sample tweet content.'}
        </div>
        
        <div className="flex items-center justify-between mt-3 text-gray-500 max-w-md">
          <div className="flex items-center gap-2 group hover:text-[#1d9bf0] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#1d9bf0]/10">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-xs">12</span>
          </div>
          <div className="flex items-center gap-2 group hover:text-[#00ba7c] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#00ba7c]/10">
              <Repeat2 className="w-4 h-4" />
            </div>
            <span className="text-xs">4</span>
          </div>
          <div className="flex items-center gap-2 group hover:text-[#f91880] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#f91880]/10">
              <Heart className="w-4 h-4" />
            </div>
            <span className="text-xs">145</span>
          </div>
          <div className="flex items-center gap-2 group hover:text-[#1d9bf0] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#1d9bf0]/10">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span className="text-xs">1.2K</span>
          </div>
          <div className="flex items-center gap-2 group hover:text-[#1d9bf0] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#1d9bf0]/10">
              <Share className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
