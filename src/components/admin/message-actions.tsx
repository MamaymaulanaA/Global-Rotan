'use client';

import { Mail, MessageCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { deleteMessage, updateMessageStatus } from '@/app/admin/actions/inquiries';
import { buttonClasses } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { whatsappUrl } from '@/lib/whatsapp';

export function MessageActions({ id, status, email, phone, subject }: { id: string; status: string; email: string; phone: string | null; subject: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) =>
    start(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(result.message ?? 'Saved');
        router.refresh();
      } else toast.error(result.error ?? 'Failed');
    });

  const btn = buttonClasses({ variant: 'outline', size: 'sm', className: 'border-field-border px-3 text-[0.8125rem]' });
  const phoneDigits = phone?.replace(/\D/g, '') ?? '';

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <a href={`mailto:${email}?subject=${encodeURIComponent(`Re: ${subject ?? 'Your message to Global Rotan'}`)}`} className={btn} onClick={() => status !== 'replied' && run(() => updateMessageStatus(id, 'replied'))}>
        <Mail className="size-4" aria-hidden /> Reply by email
      </a>
      {phoneDigits.length >= 8 && (
        <a href={whatsappUrl(phoneDigits)} target="_blank" rel="noopener noreferrer" className={btn}>
          <MessageCircle className="size-4" aria-hidden /> WhatsApp
        </a>
      )}
      {status === 'new' && (
        <button type="button" className={btn} disabled={pending} onClick={() => run(() => updateMessageStatus(id, 'read'))}>
          Mark as read
        </button>
      )}
      {status !== 'replied' && (
        <button type="button" className={btn} disabled={pending} onClick={() => run(() => updateMessageStatus(id, 'replied'))}>
          Mark as replied
        </button>
      )}
      <button type="button" className={btn} disabled={pending} onClick={() => run(() => updateMessageStatus(id, status === 'archived' ? 'read' : 'archived'))}>
        {status === 'archived' ? 'Restore' : 'Archive'}
      </button>
      <button type="button" className={`${btn} text-danger hover:border-danger hover:bg-danger-soft`} disabled={pending} onClick={() => setConfirm(true)}>
        <Trash2 className="size-4" aria-hidden /> Delete
      </button>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          run(() => deleteMessage(id));
        }}
        title="Delete this message?"
        message="This permanently removes the message. Archive it instead if you may need it later."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        closeLabel="Close"
      />
    </div>
  );
}
