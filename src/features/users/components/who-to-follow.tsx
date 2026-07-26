import { Button } from '@/components/ui/button';

export function WhoToFollow() {
  const suggestedUsers = [
    { id: '1', name: 'Khoa Pug', username: 'khoapug', avatar: '' },
    { id: '2', name: 'Độ Mixi', username: 'mixigaming', avatar: '' },
    { id: '3', name: 'PewPew', username: 'pewpew', avatar: '' },
  ];

  return (
    <div className="bg-[#16181c] rounded-2xl flex flex-col pt-3 border border-[#16181c]">
      <h2 className="font-bold text-xl px-4 mb-4">Gợi ý theo dõi</h2>
      {suggestedUsers.map((user) => (
        <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0 overflow-hidden">
              {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : null}
            </div>
            <div className="truncate max-w-[120px]">
              <div className="font-bold text-sm leading-tight truncate hover:underline">{user.name}</div>
              <div className="text-gray-500 text-sm leading-tight truncate">@{user.username}</div>
            </div>
          </div>
          <Button className="rounded-full font-bold bg-white text-black hover:bg-gray-200 h-8 px-4">
            Follow
          </Button>
        </div>
      ))}
      <div className="hover:bg-white/5 cursor-pointer px-4 py-4 rounded-b-2xl transition-colors text-[#1d9bf0]">
        Xem thêm
      </div>
    </div>
  );
}
