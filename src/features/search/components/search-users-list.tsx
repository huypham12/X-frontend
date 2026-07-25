'use client';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/features/search/api/search.service';
import Link from 'next/link';

export function SearchUsersList({ query }: { query: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['search-users', query],
    queryFn: () => searchService.searchUsers(query),
    enabled: !!query,
  });

  const users = data?.data?.users || [];

  if (isLoading) {
    return <div className="text-center text-gray-500 py-8">Searching...</div>;
  }

  if (users.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center max-w-[400px] mx-auto mt-8">
        <h2 className="text-3xl font-bold mb-2">No results for &quot;{query}&quot;</h2>
        <p className="text-gray-500 mb-6">Try searching for something else, or check your spelling.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {users.map((user: any) => (
        <Link 
          href={`/profile/${user.username}`} 
          key={user._id}
          className="flex items-center gap-3 hover:bg-white/5 p-4 transition-colors cursor-pointer outline-none border-b border-[#2F3336]"
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
          {/* Optional: Add a follow button here if not the current user */}
          <div className="shrink-0">
            <button className="bg-white text-black font-bold px-4 py-1.5 rounded-full text-sm hover:bg-gray-200 transition-colors">
              Follow
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
}
