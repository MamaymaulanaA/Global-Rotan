'use client';

import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { verifyAdminSession } from '@/app/admin/actions/session';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { createClient } from '@/lib/supabase/browser';

const MESSAGES: Record<string, string> = {
  invalid: 'Incorrect email or password.',
  unauthorized: 'This account does not have admin access. Ask an existing admin to grant access.',
  generic: 'Sign in failed. Please try again.',
};

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(initialError);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setLoading(false);
      setError(signInError.status === 400 ? 'invalid' : 'generic');
      return;
    }
    const result = await verifyAdminSession();
    if (!result.ok) {
      await supabase.auth.signOut();
      setLoading(false);
      setError('unauthorized');
      return;
    }
    router.replace(next);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-[0.875rem] text-danger">
          {MESSAGES[error] ?? MESSAGES.generic}
        </p>
      )}
      <Field label="Email" required>
        {({ id }) => <Input id={id} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />}
      </Field>
      <Field label="Password" required>
        {({ id }) => (
          <div className="relative">
            <Input id={id} type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-12" required />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-0.5 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center text-muted hover:text-ink"
            >
              {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
        )}
      </Field>
      <Button type="submit" variant="dark" className="w-full" loading={loading} icon={<LogIn className="size-4" aria-hidden />} disabled={!email || !password}>
        Sign in
      </Button>
      <button
        type="button"
        disabled={!email || loading}
        onClick={async () => {
          const { error: resetError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/admin/auth/set-password`,
          });
          setNotice(resetError ? null : 'If this email belongs to an account, a password reset link has been sent.');
          if (resetError) setError('generic');
        }}
        className="block min-h-11 w-full text-center text-[0.875rem] text-muted hover:text-ink disabled:opacity-50"
      >
        Forgot password? Enter your email, then click here.
      </button>
      {notice && (
        <p role="status" className="rounded-md bg-success-soft px-4 py-3 text-[0.875rem] text-success">
          {notice}
        </p>
      )}
    </form>
  );
}
