import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/layout/logo';
import { getAdmin } from '@/lib/admin/auth';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  if (isSupabaseConfigured() && (await getAdmin())) redirect(next?.startsWith('/admin') ? next : '/admin');

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="mt-8 rounded-lg border border-line bg-surface p-6 sm:p-8">
          <h1 className="text-2xl">Admin sign in</h1>
          <p className="mt-1.5 text-[0.9375rem] text-muted">Only authorized Global Rotan administrators can access the dashboard.</p>
          {!isSupabaseConfigured() ? (
            <p className="mt-6 rounded-md bg-warning-soft px-4 py-3 text-[0.875rem] text-warning">
              Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment.
            </p>
          ) : (
            <LoginForm next={next?.startsWith('/admin') ? next : '/admin'} initialError={error === 'unauthorized' ? 'unauthorized' : undefined} />
          )}
        </div>
      </div>
    </main>
  );
}
