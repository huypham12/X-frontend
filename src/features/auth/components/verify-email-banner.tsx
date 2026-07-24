'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { authService } from '@/features/auth/api/auth.service';
import { toast } from 'sonner';

export function VerifyEmailBanner() {
  const user = useAuthStore((state) => state.user);
  const [isSending, setIsSending] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user || user.verify !== 0) {
    return null;
  }

  const handleResend = async () => {
    try {
      setIsSending(true);
      await authService.resendVerifyEmail();
      toast.success('Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#1d9bf0] text-white px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm z-50 fixed top-0 left-0 w-full">
      <span>Tài khoản của bạn chưa được xác thực. Vui lòng kiểm tra email để xác thực.</span>
      <button 
        onClick={handleResend}
        disabled={isSending}
        className="font-bold underline hover:text-gray-200 disabled:opacity-50"
      >
        {isSending ? 'Đang gửi...' : 'Gửi lại email'}
      </button>
    </div>
  );
}
