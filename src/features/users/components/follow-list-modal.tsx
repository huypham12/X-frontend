'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/features/users/api/user.service';
import Link from 'next/link';

interface FollowListModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  type: 'followers' | 'following';
  userId: string;
}

export function FollowListModal({ open, setOpen, type, userId }: FollowListModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['follow-list', type, userId],
    queryFn: () => type === 'followers' ? userService.getFollowers(userId) : userService.getFollowing(userId),
    enabled: open && !!userId
  });

  const users = type === 'followers' ? data?.followers : data?.following;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[400px] bg-[#181818] border-none text-white p-0 gap-0 max-h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl">
        <DialogHeader className="px-5 py-4 border-b border-white/10 sticky top-0 bg-[#181818]/90 backdrop-blur-md z-10">
          <DialogTitle className="text-xl font-bold text-center">
            {type === 'followers' ? 'Followers' : 'Following'}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto p-2 flex flex-col">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : users?.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </div>
          ) : (
            users?.map((user: any) => (
              <Link 
                href={`/profile/${user.username}`} 
                key={user._id}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 hover:bg-white/5 p-3 rounded-xl transition-colors cursor-pointer outline-none border-none"
              >
                <div className="w-12 h-12 rounded-full bg-[#333639] overflow-hidden flex-shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="font-bold text-[15px] leading-tight hover:underline truncate">{user.name}</div>
                  <div className="text-gray-500 text-[15px] leading-tight truncate">@{user.username}</div>
                  {user.bio && (
                    <div className="text-[14px] mt-1 text-gray-400 truncate">{user.bio}</div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
