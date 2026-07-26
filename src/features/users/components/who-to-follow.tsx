'use client';

import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../api/user.service';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function WhoToFollow() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: suggestedUsers, isLoading } = useQuery({
    queryKey: ['suggestedUsers'],
    queryFn: userService.getSuggestedUsers
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) => userService.followUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: (userId: string) => userService.unfollowUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
    }
  });

  if (isLoading) {
    return (
      <div className="bg-[#16181c] rounded-2xl flex flex-col pt-3 border border-[#16181c] min-h-[200px] animate-pulse">
        <h2 className="font-bold text-xl px-4 mb-4">Gợi ý theo dõi</h2>
        <div className="px-4 text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!suggestedUsers || suggestedUsers.length === 0) {
    return null; // Không hiển thị nếu không có gợi ý
  }

  return (
    <div className="bg-[#16181c] rounded-2xl flex flex-col pt-3 border border-[#16181c]">
      <h2 className="font-bold text-xl px-4 mb-4">Gợi ý theo dõi</h2>
      {suggestedUsers.map((user: any) => (
        <div 
          key={user._id} 
          className="flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
          onClick={() => router.push(`/profile/${user.username}`)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0 overflow-hidden relative">
              {user.avatar && <Image src={user.avatar} alt={user.name} fill className="object-cover" />}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[15px] hover:underline truncate max-w-[120px]">{user.name}</span>
              <span className="text-[#71767b] text-[15px] truncate max-w-[120px]">@{user.username}</span>
            </div>
          </div>
          <Button 
            className={user.is_following ? "rounded-full font-bold bg-black text-white border border-gray-600 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 h-8 px-4" : "rounded-full font-bold bg-white text-black hover:bg-gray-200 h-8 px-4"}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (user.is_following) {
                unfollowMutation.mutate(user._id);
              } else {
                followMutation.mutate(user._id);
              }
            }}
          >
            {user.is_following ? 'Following' : 'Follow'}
          </Button>
        </div>
      ))}
      <div className="hover:bg-white/5 cursor-pointer px-4 py-4 rounded-b-2xl transition-colors text-[#1d9bf0]">
        Xem thêm
      </div>
    </div>
  );
}
