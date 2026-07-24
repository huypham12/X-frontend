'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authService } from '@/features/auth/api/auth.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

export function ForgotPasswordForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const mutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => {
      toast.success('Đã gửi email khôi phục mật khẩu.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Tìm tài khoản</h1>
        <p className="text-sm text-gray-500 mt-2">Nhập email liên kết với tài khoản của bạn để thay đổi mật khẩu.</p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input placeholder="Email" {...form.register('email')} className="bg-[#121212] border-gray-800 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-700" />
          {form.formState.errors.email && <span className="text-red-500 text-sm mt-1 ml-1">{form.formState.errors.email.message}</span>}
        </div>
        
        <Button type="submit" disabled={mutation.isPending} className="w-full rounded-full h-12 font-bold text-md bg-white text-black hover:bg-gray-200 transition-colors mt-4">
          {mutation.isPending ? 'Đang gửi...' : 'Tiếp theo'}
        </Button>
      </form>
      <div className="text-center text-sm text-gray-500">
        <Link href="/login" className="text-white hover:underline transition-colors">
          Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
}
