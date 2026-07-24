'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth/api/auth.service';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự'),
});

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      toast.success('Đăng nhập thành công');
      const { access_token, refresh_token } = data.data;
      setAuth(null as any, access_token, refresh_token);
      router.push('/home');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Đăng nhập vào X</h1>
        <p className="text-sm text-gray-500 mt-2">Nhập email và mật khẩu của bạn.</p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input 
            placeholder="Email" 
            {...form.register('email')} 
            className="bg-[#121212] border-gray-800 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-700" 
          />
          {form.formState.errors.email && <span className="text-red-500 text-sm mt-1 ml-1">{form.formState.errors.email.message}</span>}
        </div>
        <div>
          <Input 
            type="password" 
            placeholder="Mật khẩu" 
            {...form.register('password')} 
            className="bg-[#121212] border-gray-800 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-700" 
          />
          {form.formState.errors.password && <span className="text-red-500 text-sm mt-1 ml-1">{form.formState.errors.password.message}</span>}
        </div>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-gray-400 hover:text-white transition-colors">
            Quên mật khẩu?
          </Link>
        </div>
        <Button 
          type="submit" 
          disabled={mutation.isPending} 
          className="w-full rounded-full h-12 font-bold text-md bg-white text-black hover:bg-gray-200 transition-colors"
        >
          {mutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
      <div className="text-center text-sm text-gray-500">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="text-white hover:underline transition-colors">
          Đăng ký
        </Link>
      </div>
    </div>
  );
}
