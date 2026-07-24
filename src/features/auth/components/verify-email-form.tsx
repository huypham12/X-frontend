'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authService } from '@/features/auth/api/auth.service';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    authService.verifyEmail({ email_verify_token: token })
      .then(() => {
        setStatus('success');
        toast.success('Xác thực email thành công!');
      })
      .catch((error) => {
        setStatus('error');
        toast.error(error.response?.data?.message || 'Xác thực thất bại');
      });
  }, [token]);

  return (
    <div className="space-y-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Xác thực Email</h1>
      
      {status === 'loading' && <p className="text-gray-500">Đang tiến hành xác thực...</p>}
      
      {status === 'success' && (
        <div className="space-y-4">
          <p className="text-green-500">Tài khoản của bạn đã được xác thực thành công.</p>
          <Button onClick={() => router.push('/login')} className="w-full rounded-full h-12 font-bold text-md bg-white text-black hover:bg-gray-200">
            Đến trang Đăng nhập
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <p className="text-red-500">Link xác thực không hợp lệ hoặc đã hết hạn.</p>
          <Button onClick={() => router.push('/login')} className="w-full rounded-full h-12 font-bold text-md bg-white text-black hover:bg-gray-200">
            Quay lại
          </Button>
        </div>
      )}
    </div>
  );
}
