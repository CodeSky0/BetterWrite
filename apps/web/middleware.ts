import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge Runtime 不支持 node:path 等 Node.js 模块，因此不能从 @/lib/auth 导入
// （auth.ts 依赖 @betterwrite/db -> node:path）。Lucia 默认 cookie 名为 'auth_session'。
const SESSION_COOKIE_NAME = 'auth_session';

const PROTECTED_PREFIXES = ['/admin', '/teacher', '/student', '/school'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Bug #46: 改用 lucia 的 sessionCookieName 而非硬编码 'auth_session'，
  // 避免将来改动 cookie 名称时这里静默失效。
  const session = request.cookies.get(SESSION_COOKIE_NAME);
  if (!session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*', '/student/:path*', '/school/:path*'],
};
