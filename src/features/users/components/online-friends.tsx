export interface OnlineUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isOnline?: boolean;
}

export function OnlineFriends() {
  const friends: OnlineUser[] = [
    { id: '1', name: 'Trấn Thành', username: 'tranthanh', avatar: '', isOnline: true },
    { id: '2', name: 'Sơn Tùng M-TP', username: 'sontungmtp', avatar: '', isOnline: true },
    { id: '3', name: 'Chi Pu', username: 'chipu', avatar: '', isOnline: false },
    { id: '4', name: 'Mỹ Tâm', username: 'mytam', avatar: '', isOnline: true },
  ];

  return (
    <div className="bg-[#16181c] rounded-2xl flex flex-col pt-3 border border-[#16181c]">
      <h2 className="font-bold text-xl px-4 mb-4">Bạn bè</h2>
      {friends.map((user) => (
        <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0 overflow-hidden">
                {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : null}
              </div>
              {user.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#16181c]"></div>
              )}
            </div>
            <div className="truncate max-w-[120px]">
              <div className="font-bold text-sm leading-tight truncate hover:underline">{user.name}</div>
              <div className="text-gray-500 text-sm leading-tight truncate">@{user.username}</div>
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
