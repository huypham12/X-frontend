'use client';

import Image from 'next/image';
import { useFriendPresence } from '../hooks/use-friend-presence';
import { FriendPresenceDot } from './friend-presence-dot';

export function OnlineFriends() {
  const { friends, isLoading, isOnlineFriend } = useFriendPresence();

  if (isLoading) {
    return (
      <div className="bg-[#16181c] rounded-2xl flex flex-col pt-3 border border-[#16181c] min-h-[200px] animate-pulse">
        <h2 className="font-bold text-xl px-4 mb-4">Bạn bè</h2>
        <div className="px-4 text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!friends || friends.length === 0) {
    return null; // Ẩn nếu không có bạn bè
  }

  return (
    <div className="bg-[#16181c] rounded-2xl flex flex-col pt-3 border border-[#16181c]">
      <h2 className="font-bold text-xl px-4 mb-4">Bạn bè</h2>
      {friends.map((user) => (
        <div key={user._id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0 overflow-hidden relative">
                {user.avatar && <Image src={user.avatar} alt={user.name} fill className="object-cover" />}
              </div>
              <FriendPresenceDot
                isOnline={isOnlineFriend(user._id)}
                showOffline
                className="border-[#16181c]"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[15px] hover:underline truncate max-w-[120px]">{user.name}</span>
              <span className="text-[#71767b] text-[15px] truncate max-w-[120px]">@{user.username}</span>
            </div>
          </div>
        </div>
      ))}
      <div className="hover:bg-white/5 cursor-pointer px-4 py-4 rounded-b-2xl transition-colors text-[#1d9bf0]">
        Hiển thị thêm
      </div>
    </div>
  );
}
