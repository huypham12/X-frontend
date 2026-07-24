'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { authService } from '@/features/auth/api/auth.service';
import Cookies from 'js-cookie';

export function ProfileMenu() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        await authService.logout({ refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      router.push('/login');
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative mt-auto">
        <div className="p-3 flex items-center justify-between hover:bg-[#181818] rounded-full cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0 overflow-hidden">
            </div>
            <div className="hidden lg:block truncate max-w-[120px]">
              <div className="font-bold text-sm leading-tight truncate">User</div>
              <div className="text-gray-500 text-sm leading-tight truncate">@username</div>
            </div>
          </div>
          <MoreHorizontal className="hidden lg:block w-5 h-5 flex-shrink-0" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative mt-auto" ref={menuRef}>
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-[110%] left-0 w-[260px] bg-black border border-[#2F3336] rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)] py-2 z-50 overflow-hidden font-bold">
          <div 
            className="px-4 py-3 hover:bg-[#181818] cursor-pointer transition-colors"
            onClick={() => {
              setIsOpen(false);
              router.push('/change-password');
            }}
          >
            Đổi mật khẩu
          </div>
          <div 
            className="px-4 py-3 hover:bg-[#181818] cursor-pointer transition-colors"
            onClick={() => {
              setIsOpen(false);
              router.push('/forgot-password');
            }}
          >
            Quên mật khẩu
          </div>
          <div 
            className="px-4 py-3 hover:bg-[#181818] cursor-pointer transition-colors"
            onClick={handleLogout}
          >
            Đăng xuất @{user.username}
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 flex items-center justify-between hover:bg-[#181818] rounded-full cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0 overflow-hidden">
            {user.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : null}
          </div>
          <div className="hidden lg:block truncate max-w-[120px]">
            <div className="font-bold text-sm leading-tight truncate">{user.name}</div>
            <div className="text-gray-500 text-sm leading-tight truncate">@{user.username}</div>
          </div>
        </div>
        <MoreHorizontal className="hidden lg:block w-5 h-5 flex-shrink-0" />
      </div>
    </div>
  );
}
