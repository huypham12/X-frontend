'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import { EditProfileModal } from '@/features/users/components/edit-profile-modal';
import { FollowListModal } from '@/features/users/components/follow-list-modal';
import { ProfileFeed } from '@/features/tweets/components/profile-feed';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/features/users/api/user.service';

interface ProfileViewProps {
  username?: string;
}

export function ProfileView({ username }: ProfileViewProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);
  const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isOwnProfile = !username || username === currentUser?.username;

  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ['user', username],
    queryFn: () => userService.getProfile(username!),
    enabled: !isOwnProfile,
  });

  const displayUser = isOwnProfile ? currentUser : profileResponse?.user?.[0];

  const followMutation = useMutation({
    mutationFn: () => userService.followUser(displayUser?._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', username] })
  });

  const unfollowMutation = useMutation({
    mutationFn: () => userService.unfollowUser(displayUser?._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', username] })
  });

  if (!mounted || (isLoading && !isOwnProfile)) {
    return <div className="min-h-screen bg-black"></div>;
  }

  const handleFollowClick = () => {
    if (displayUser?.is_following) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const handleFollowListClick = (type: 'followers' | 'following') => {
    if (isOwnProfile) {
      setFollowListType(type);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2F3336] flex items-center px-4 h-14 gap-6">
        <Link href="/home" className="hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-bold text-xl leading-tight">{displayUser?.name || 'User'}</h1>
          <p className="text-sm text-gray-500 leading-tight">0 posts</p>
        </div>
      </div>

      {/* Banner */}
      <div className="h-[200px] bg-[#333639] w-full relative">
        {displayUser?.cover_photo && (
          <img src={displayUser.cover_photo} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4 border-b border-[#2F3336] relative">
        <div className="flex justify-between items-start">
          <div className="w-[134px] h-[134px] rounded-full border-4 border-black bg-gray-600 -mt-[67px] relative overflow-hidden">
            {displayUser?.avatar && (
              <img src={displayUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
            )}
          </div>
          
          <div className="mt-4">
            {isOwnProfile ? (
              <EditProfileModal />
            ) : (
              <button 
                onClick={handleFollowClick}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                className={`rounded-full font-bold px-4 py-1.5 border transition-colors ${
                  displayUser?.is_following 
                    ? 'border-gray-500 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10' 
                    : 'bg-white text-black hover:bg-gray-200 border-white'
                }`}
              >
                {displayUser?.is_following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-3">
          <h2 className="font-bold text-xl leading-tight">{displayUser?.name || 'User'}</h2>
          <p className="text-gray-500 leading-tight">@{displayUser?.username || 'username'}</p>
        </div>

        {displayUser?.bio && (
          <div className="mt-3 text-[15px] whitespace-pre-wrap">
            {displayUser.bio}
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 text-gray-500 text-[15px]">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Joined {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="flex gap-4 mt-3 text-sm">
          <div 
            onClick={() => handleFollowListClick('following')}
            className={`flex gap-1 transition-all ${isOwnProfile ? 'hover:underline cursor-pointer' : 'cursor-default opacity-80'}`}
          >
            <span className="font-bold text-white">{displayUser?.following_count || 0}</span>
            <span className="text-gray-500">Following</span>
          </div>
          <div 
            onClick={() => handleFollowListClick('followers')}
            className={`flex gap-1 transition-all ${isOwnProfile ? 'hover:underline cursor-pointer' : 'cursor-default opacity-80'}`}
          >
            <span className="font-bold text-white">{displayUser?.follower_count || 0}</span>
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

      {/* Feed Content */}
      <div className="flex-1 min-h-[500px]">
        {displayUser?.username && <ProfileFeed username={displayUser.username} />}
      </div>

      {isOwnProfile && followListType && (
        <FollowListModal
          open={!!followListType}
          setOpen={(open) => !open && setFollowListType(null)}
          type={followListType}
          userId={displayUser?._id}
        />
      )}
    </div>
  );
}
