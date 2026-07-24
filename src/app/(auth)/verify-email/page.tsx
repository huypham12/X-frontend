import { VerifyEmailForm } from '@/features/auth/components/verify-email-form';
import { Suspense } from 'react';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center">Đang kiểm tra...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
