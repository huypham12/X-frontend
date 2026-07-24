'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/features/auth/api/auth.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự'),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirm_password"],
});

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirm_password: ''
    },
  });

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      return;
    }
    
    authService.verifyForgotPasswordToken({ forgot_password_token: token })
      .then(() => {
        setIsValid(true);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn');
        setIsValid(false);
      })
      .finally(() => {
        setIsValidating(false);
      });
  }, [token]);

  const mutation = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      router.push('/login');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) {
      toast.error('Token không hợp lệ');
      return;
    }
    mutation.mutate({ forgot_password_token: token, password: values.password });
  }

  if (isValidating) {
    return (
      <div className="text-center text-gray-500">
        Đang kiểm tra yêu cầu...
      </div>
    );
  }

  if (!token || !isValid) {
    return (
      <div className="text-center text-red-500">
        Yêu cầu không hợp lệ. Vui lòng kiểm tra lại đường dẫn trong email hoặc gửi lại yêu cầu.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Mật khẩu mới</h1>
        <p className="text-sm text-gray-500 mt-2">Nhập mật khẩu mới cho tài khoản của bạn.</p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input type="password" placeholder="Mật khẩu mới" {...form.register('password')} className="bg-[#121212] border-gray-800 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-700" />
          {form.formState.errors.password && <span className="text-red-500 text-sm mt-1 ml-1">{form.formState.errors.password.message}</span>}
        </div>
        <div>
          <Input type="password" placeholder="Xác nhận mật khẩu" {...form.register('confirm_password')} className="bg-[#121212] border-gray-800 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-700" />
          {form.formState.errors.confirm_password && <span className="text-red-500 text-sm mt-1 ml-1">{form.formState.errors.confirm_password.message}</span>}
        </div>
        
        <Button type="submit" disabled={mutation.isPending} className="w-full rounded-full h-12 font-bold text-md bg-white text-black hover:bg-gray-200 transition-colors mt-4">
          {mutation.isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
        </Button>
      </form>
    </div>
  );
}
