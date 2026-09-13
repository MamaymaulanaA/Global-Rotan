import { createServerClient } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

async function adminProxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Refreshes the session cookie. Role checks happen server-side in the admin layout,
  // in every server action and in Row Level Security.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === '/admin/login' || pathname.startsWith('/admin/auth');

  if (!user && !isAuthPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('next', pathname);
    const redirect = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return adminProxy(request);
  }

  // Respect the visitor's saved language: unprefixed (English) URLs redirect to /id when they chose Indonesian.
  const saved = request.cookies.get('NEXT_LOCALE')?.value;
  const hasPrefix = pathname === '/id' || pathname.startsWith('/id/') || pathname === '/en' || pathname.startsWith('/en/');
  const isGet = request.method === 'GET' || request.method === 'HEAD';
  if (saved === 'id' && !hasPrefix && isGet && !request.headers.get('next-action')) {
    const url = request.nextUrl.clone();
    url.pathname = `/id${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  const response = intlMiddleware(request);
  // Keep the cookie in sync with the language actually being viewed.
  const viewing = pathname === '/id' || pathname.startsWith('/id/') ? 'id' : 'en';
  if (saved && saved !== viewing && hasPrefix) {
    response.cookies.set('NEXT_LOCALE', viewing, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  }
  return response;
}

export const config = {
  // Skip Next internals, API routes and static files
  matcher: ['/((?!api|_next|_vercel|demo|.*\\..*).*)'],
};
