'use client';

import { useQuery } from '@tanstack/react-query';
import { userService } from '../api/user.service';
import { useSocket } from '@/providers/socket-provider';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export function OnlineFriends() {
  const { data: friends, isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: userService.getFriends
  });

  const { socket, isConnected } = useSocket();
  const [presence, setPresence] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!socket || !isConnected || !friends || friends.length === 0) return;

    const userIds = friends.map((f: any) => f._id);
    
    // Lấy trạng thái ban đầu
    socket.emit('get:presence', userIds, (presenceList: any[]) => {
      const newPresence: Record<string, boolean> = {};
      presenceList.forEach(p => {
        newPresence[p.user_id] = p.isOnline;
      });
      setPresence(newPresence);
    });

    const handleOnline = ({ user_id }: { user_id: string }) => {
      setPresence(prev => ({ ...prev, [user_id]: true }));
    };

    const handleOffline = ({ user_id }: { user_id: string }) => {
      setPresence(prev => ({ ...prev, [user_id]: false }));
    };

    socket.on('user:online', handleOnline);
    socket.on('user:offline', handleOffline);

    return () => {
      socket.off('user:online', handleOnline);
      socket.off('user:offline', handleOffline);
    };
  }, [socket, isConnected, friends]);

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
      {friends.map((user: any) => (
        <div key={user._id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0 overflow-hidden relative">
                {user.avatar && <Image src={user.avatar} alt={user.name} fill className="object-cover" />}
              </div>
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#16181c] ${presence[user._id] ? 'bg-green-500' : 'bg-gray-500'}`}></div>
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
