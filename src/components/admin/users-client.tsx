'use client';

import { ShieldCheck, ShieldOff, UserCheck, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { inviteAdmin, setUserActive, setUserRole } from '@/app/admin/actions/media-users';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { ActionsMenu } from './actions-menu';
import { Field, Input } from '@/components/ui/form';

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return {
    pending,
    run: (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, onOk?: () => void) =>
      start(async () => {
        const result = await fn();
        if (result.ok) {
          toast.success(result.message ?? 'Saved');
          onOk?.();
          router.refresh();
        } else toast.error(result.error ?? 'Failed');
      }),
  };
}

export function UserRowActions({ id, role, active, label = 'user' }: { id: string; role: string; active: boolean; label?: string }) {
  const { pending, run } = useRun();
  const [confirmRemove, setConfirmRemove] = useState(false);
  return (
    <>
      <ActionsMenu
        label={`Actions for ${label}`}
        disabled={pending}
        items={[
          role === 'admin'
            ? { label: 'Remove admin access…', icon: ShieldOff, danger: true, onSelect: () => setConfirmRemove(true) }
            : { label: 'Make admin', icon: ShieldCheck, onSelect: () => run(() => setUserRole(id, 'admin')) },
          active
            ? { label: 'Deactivate', icon: UserX, onSelect: () => run(() => setUserActive(id, false)) }
            : { label: 'Activate', icon: UserCheck, onSelect: () => run(() => setUserActive(id, true)) },
        ]}
      />
      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          run(() => setUserRole(id, 'user'));
        }}
        title="Remove admin access?"
        message={`${label} will no longer be able to open the admin dashboard.`}
        confirmLabel="Remove access"
        cancelLabel="Cancel"
        closeLabel="Close"
      />
    </>
  );
}

export function InviteAdminForm() {
  const { pending, run } = useRun();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => inviteAdmin(email, name), () => {
          setEmail('');
          setName('');
        });
      }}
    >
      <Field label="Full name" optionalLabel="optional">
        {({ id }) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />}
      </Field>
      <Field label="Email" required>
        {({ id }) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />}
      </Field>
      <Button type="submit" variant="dark" size="sm" loading={pending} disabled={!email}>
        Send invitation
      </Button>
    </form>
  );
}
