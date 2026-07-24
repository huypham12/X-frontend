import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const token = request.cookies.get('access_token')?.value;

  // Nếu đã đăng nhập mà cố vào trang auth (như login, register) thì đá về home
  if (token && publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Nếu chưa đăng nhập mà cố vào các trang không public (như home, profile) thì đá về login
  if (!token && !publicRoutes.some((route) => pathname.startsWith(route)) && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
