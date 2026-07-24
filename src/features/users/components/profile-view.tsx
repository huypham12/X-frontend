'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import { EditProfileModal } from '@/features/users/components/edit-profile-modal';

export function ProfileView() {
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-black"></div>; // Or a skeleton loader
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2F3336] flex items-center px-4 h-14 gap-6">
        <Link href="/home" className="hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-bold text-xl leading-tight">{user?.name || 'User'}</h1>
          <p className="text-sm text-gray-500 leading-tight">0 posts</p>
        </div>
      </div>

      {/* Banner */}
      <div className="h-[200px] bg-[#333639] w-full relative">
        {user?.cover_photo && (
          <img src={user.cover_photo} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4 border-b border-[#2F3336] relative">
        <div className="flex justify-between items-start">
          <div className="w-[134px] h-[134px] rounded-full border-4 border-black bg-gray-600 -mt-[67px] relative overflow-hidden">
            {user?.avatar && (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            )}
          </div>
          
          <div className="mt-4">
            <EditProfileModal />
          </div>
        </div>

        <div className="mt-3">
          <h2 className="font-bold text-xl leading-tight">{user?.name || 'User'}</h2>
          <p className="text-gray-500 leading-tight">@{user?.username || 'username'}</p>
        </div>

        {user?.bio && (
          <div className="mt-3 text-[15px] whitespace-pre-wrap">
            {user.bio}
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 text-gray-500 text-[15px]">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Joined {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="flex gap-4 mt-3 text-sm">
          <div className="flex gap-1 hover:underline cursor-pointer">
            <span className="font-bold text-white">0</span>
            <span className="text-gray-500">Following</span>
          </div>
          <div className="flex gap-1 hover:underline cursor-pointer">
            <span className="font-bold text-white">0</span>
            <span className="text-gray-500">Followers</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2F3336]">
        <div className="flex-1 hover:bg-[#181818] cursor-pointer transition-colors flex justify-center items-center h-14">
          <div className="relative h-full flex items-center">
            <span className="font-bold">Posts</span>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#1d9bf0] rounded-full" />
          </div>
        </div>
        <div className="flex-1 hover:bg-[#181818] cursor-pointer transition-colors flex justify-center items-center h-14 text-gray-500">
          <span className="font-medium">Replies</span>
        </div>
        <div className="flex-1 hover:bg-[#181818] cursor-pointer transition-colors flex justify-center items-center h-14 text-gray-500">
          <span className="font-medium">Highlights</span>
        </div>
        <div className="flex-1 hover:bg-[#181818] cursor-pointer transition-colors flex justify-center items-center h-14 text-gray-500">
          <span className="font-medium">Media</span>
        </div>
        <div className="flex-1 hover:bg-[#181818] cursor-pointer transition-colors flex justify-center items-center h-14 text-gray-500">
          <span className="font-medium">Likes</span>
        </div>
      </div>

      {/* Empty State */}
      <div className="p-8 text-center flex flex-col items-center max-w-[400px] mx-auto mt-8">
        <h2 className="text-3xl font-bold mb-2">Nothing to see here — yet</h2>
        <p className="text-gray-500 mb-6">When you post tweets, they will show up here.</p>
        <button className="rounded-full font-bold bg-[#1d9bf0] text-white hover:bg-[#1a8cd8] px-6 py-3">
          Write a post
        </button>
      </div>
    </div>
  );
}
