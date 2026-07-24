import { redirect } from 'next/navigation';

export default function HomePage() {
  // Tự động chuyển hướng từ trang gốc (/) sang trang /login
  redirect('/login');
}
