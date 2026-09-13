'use client';

import type { EmailOtpType } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { createClient } from '@/lib/supabase/browser';

/** Handles invitation and password-reset links (hash tokens, token_hash or PKCE code), then sets a new password. */
export default function SetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const run = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
      try {
        if (hash.get('access_token') && hash.get('refresh_token')) {
          const { error: e } = await supabase.auth.setSession({ access_token: hash.get('access_token')!, refresh_token: hash.get('refresh_token')! });
          if (e) throw e;
        } else if (url.searchParams.get('token_hash') && url.searchParams.get('type')) {
          const { error: e } = await supabase.auth.verifyOtp({ token_hash: url.searchParams.get('token_hash')!, type: url.searchParams.get('type') as EmailOtpType });
          if (e) throw e;
        } else if (url.searchParams.get('code')) {
          const { error: e } = await supabase.auth.exchangeCodeForSession(url.searchParams.get('code')!);
          if (e) throw e;
        }
        window.history.replaceState(null, '', url.pathname);
        const { data } = await supabase.auth.getUser();
        setReady(data.user ? 'ok' : 'invalid');
      } catch {
        setReady('invalid');
      }
    };
    run();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 10) return setError('Use at least 10 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setSaving(true);
    const { error: e } = await createClient().auth.updateUser({ password });
    setSaving(false);
    if (e) return setError(e.message);
    router.replace('/admin');
    router.refresh();
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="mt-8 rounded-lg border border-line bg-surface p-6 sm:p-8">
          <h1 className="text-2xl">Set your password</h1>
          {ready === 'checking' && <p className="mt-4 text-muted">Verifying your link…</p>}
          {ready === 'invalid' && (
            <p className="mt-4 rounded-md bg-danger-soft px-4 py-3 text-[0.875rem] text-danger">
              This link is invalid or has expired. Ask an administrator to send a new invitation, or request a new reset link from the sign-in page.
            </p>
          )}
          {ready === 'ok' && (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {error && (
                <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-[0.875rem] text-danger">
                  {error}
                </p>
              )}
              <Field label="New password" required hint="At least 10 characters">
                {({ id, describedBy }) => <Input id={id} type="password" autoComplete="new-password" aria-describedby={describedBy} value={password} onChange={(e) => setPassword(e.target.value)} />}
              </Field>
              <Field label="Confirm password" required>
                {({ id }) => <Input id={id} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
              </Field>
              <Button type="submit" variant="dark" className="w-full" loading={saving}>
                Save password
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
