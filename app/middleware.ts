import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareSupabase } from './lib/supabase';

export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  try {
    const supabase = await createMiddlewareSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    const isProtected = request.nextUrl.pathname.startsWith('/bookmarks');
    const isAuth = request.nextUrl.pathname.startsWith('/login');

    if (isProtected && !user) return NextResponse.redirect(new URL('/login', request.url));
    if (isAuth && user) return NextResponse.redirect(new URL('/bookmarks', request.url));

    return NextResponse.next();
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};