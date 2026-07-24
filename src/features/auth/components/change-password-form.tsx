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

const formSchema = z.object({
  old_password: z.string().min(1, 'Vui lòng nhập mật khẩu cũ'),
  new_password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự'),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirm_password"],
});

export function ChangePasswordForm() {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: ''
    },
  });

  const mutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!');
      form.reset();
      router.push('/home'); // Optional: redirect back to home
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <div className="w-full max-w-lg mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Đổi mật khẩu</h1>
        <p className="text-sm text-gray-500 mt-2">Cập nhật mật khẩu mới cho tài khoản của bạn.</p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input 
            type="password" 
            placeholder="Mật khẩu hiện tại" 
            {...form.register('old_password')} 
            className="bg-[#121212] border-gray-800 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-700" 
          />
          {form.formState.errors.old_password && <span className="text-red-500 text-sm mt-1 ml-1">{form.formState.errors.old_password.message}</span>}
        </div>
        <div>
          <Input 
            type="password" 
            placeholder="Mật khẩu mới" 
            {...form.register('new_password')} 
            className="bg-[#121212] border-gray-800 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-700" 
          />
          {form.formState.errors.new_password && <span className="text-red-500 text-sm mt-1 ml-1">{form.formState.errors.new_password.message}</span>}
        </div>
        <div>
          <Input 
            type="password" 
            placeholder="Xác nhận mật khẩu mới" 
            {...form.register('confirm_password')} 
            className="bg-[#121212] border-gray-800 h-14 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-700" 
          />
          {form.formState.errors.confirm_password && <span className="text-red-500 text-sm mt-1 ml-1">{form.formState.errors.confirm_password.message}</span>}
        </div>
        
        <Button 
          type="submit" 
          disabled={mutation.isPending} 
          className="w-full rounded-full h-12 font-bold text-md bg-white text-black hover:bg-gray-200 transition-colors mt-4"
        >
          {mutation.isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
        </Button>
      </form>
    </div>
  );
}
