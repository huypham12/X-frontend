'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth/api/auth.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(2, 'Tên quá ngắn'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự'),
  confirm_password: z.string(),
  date_of_birth: z.string().min(1, 'Vui lòng chọn ngày sinh')
}).refine((data) => data.password === data.confirm_password, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirm_password"],
});

export function RegisterForm() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirm_password: '',
      date_of_birth: ''
    },
  });

  const mutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      toast.success('Đăng ký thành công, vui lòng kiểm tra email để xác thực.');
      router.push('/login');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Tạo tài khoản</h1>
        <p className="text-sm text-gray-500 mt-2">Tham gia X ngay hôm nay.</p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input placeholder="Tên hiển thị" {...form.register('name')} className="bg-[#121212] border-gray-800 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-700" />
          {form.formState.errors.name && <span className="text-red-500 text-sm mt-1 ml-1">{form.formState.errors.name.message}</span>}
        </div>
        <div>
          <Input placeholder="Email" {...form.register('email')} className="bg-[#121212] border-gray-800 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-700" />
          {form.formState.errors.email && <span className="text-red-500 text-sm mt-1 ml-1">{form.formState.errors.email.message}</span>}
        </div>
        <div>
          <Input type="password" placeholder="Mật khẩu" {...form.register('password')} className="bg-[#121212] border-gray-800 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-700" />
          {form.formState.errors.password && <span className="text-red-500 text-sm mt-1 ml-1">{form.formState.errors.password.message}</span>}
        </div>
        <div>
          <Input type="password" placeholder="Xác nhận mật khẩu" {...form.register('confirm_password')} className="bg-[#121212] border-gray-800 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-700" />
          {form.formState.errors.confirm_password && <span className="text-red-500 text-sm mt-1 ml-1">{form.formState.errors.confirm_password.message}</span>}
        </div>
        <div>
          <div className="text-gray-400 text-sm mb-1 ml-1 font-semibold">Ngày sinh</div>
          <Input type="date" {...form.register('date_of_birth')} className="bg-[#121212] border-gray-800 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-700 block w-full px-3" style={{ colorScheme: 'dark' }} />
          {form.formState.errors.date_of_birth && <span className="text-red-500 text-sm mt-1 ml-1">{form.formState.errors.date_of_birth.message}</span>}
        </div>
        
        <Button type="submit" disabled={mutation.isPending} className="w-full rounded-full h-12 font-bold text-md bg-white text-black hover:bg-gray-200 transition-colors mt-4">
          {mutation.isPending ? 'Đang tạo...' : 'Đăng ký'}
        </Button>
      </form>
      <div className="text-center text-sm text-gray-500">
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-white hover:underline transition-colors">
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}
