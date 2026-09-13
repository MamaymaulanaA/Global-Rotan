'use client';

import { Archive, ArchiveRestore, CheckCircle2, Circle, ListChecks, ReceiptText, StickyNote } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { addInquiryNote, archiveInquiry, saveInquiryQuote, toggleInquiryFollowUp, updateInquiryStatus } from '@/app/admin/actions/inquiries';
import { Card, formatDate, INQUIRY_STATUS_LABEL } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { INQUIRY_STATUSES } from '@/types/domain';

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (promise: () => Promise<{ ok: boolean; error?: string; message?: string }>, onOk?: () => void) =>
    start(async () => {
      const result = await promise();
      if (result.ok) {
        toast.success(result.message ?? 'Saved');
        onOk?.();
        router.refresh();
      } else toast.error(result.error ?? 'Failed');
    });
  return { pending, run };
}

export function InquiryControls({ id, status, archived, followedUpAt }: { id: string; status: string; archived: boolean; followedUpAt: string | null }) {
  const { pending, run } = useRun();
  const [value, setValue] = useState(status);
  return (
    <Card title="Status & follow-up" icon={ListChecks}>
      <Field label="Inquiry status">
        {({ id: fieldId }) => (
          <div className="flex gap-2">
            <Select id={fieldId} value={value} onChange={(e) => setValue(e.target.value)} className="flex-1">
              {INQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {INQUIRY_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
            <Button variant="dark" size="sm" className="min-h-12" disabled={value === status} loading={pending} onClick={() => run(() => updateInquiryStatus(id, value))}>
              Update
            </Button>
          </div>
        )}
      </Field>
      <div className="mt-4 space-y-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => toggleInquiryFollowUp(id, !followedUpAt))}
          className="flex min-h-11 w-full items-center gap-2.5 rounded-md border border-field-border px-3 text-left text-[0.9375rem] transition-colors hover:border-field-border-hover hover:bg-hover-soft disabled:opacity-50"
        >
          {followedUpAt ? <CheckCircle2 className="size-5 text-success" aria-hidden /> : <Circle className="size-5 text-muted" aria-hidden />}
          <span className="flex-1">{followedUpAt ? `Followed up · ${formatDate(followedUpAt, true)}` : 'Mark as followed up'}</span>
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => archiveInquiry(id, !archived))}
          className="flex min-h-11 w-full items-center gap-2.5 rounded-md border border-field-border px-3 text-left text-[0.9375rem] transition-colors hover:border-field-border-hover hover:bg-hover-soft disabled:opacity-50"
        >
          {archived ? <ArchiveRestore className="size-5" aria-hidden /> : <Archive className="size-5" aria-hidden />}
          {archived ? 'Restore from archive' : 'Archive inquiry'}
        </button>
      </div>
    </Card>
  );
}

export function InquiryQuoteForm({
  id,
  defaults,
}: {
  id: string;
  defaults: { quoted_price: string; quoted_currency: 'USD' | 'IDR'; shipping_estimate: string; quoted_moq: string };
}) {
  const { pending, run } = useRun();
  const [v, setV] = useState(defaults);
  return (
    <Card title="Quotation details" icon={ReceiptText}>
      <div className="grid gap-4">
        <div className="grid grid-cols-[1fr_110px] gap-2">
          <Field label="Quoted price (total)">
            {({ id: f }) => <Input id={f} type="number" step="0.01" min="0" value={v.quoted_price} onChange={(e) => setV({ ...v, quoted_price: e.target.value })} />}
          </Field>
          <Field label="Currency">
            {({ id: f }) => (
              <Select id={f} value={v.quoted_currency} onChange={(e) => setV({ ...v, quoted_currency: e.target.value as 'USD' | 'IDR' })}>
                <option value="USD">USD</option>
                <option value="IDR">IDR</option>
              </Select>
            )}
          </Field>
        </div>
        <Field label="Shipping estimate" hint={`In ${v.quoted_currency}`}>
          {({ id: f }) => <Input id={f} type="number" step="0.01" min="0" value={v.shipping_estimate} onChange={(e) => setV({ ...v, shipping_estimate: e.target.value })} />}
        </Field>
        <Field label="Minimum order (agreed)">
          {({ id: f }) => <Input id={f} type="number" min="1" value={v.quoted_moq} onChange={(e) => setV({ ...v, quoted_moq: e.target.value })} />}
        </Field>
        <Button variant="dark" size="sm" loading={pending} onClick={() => run(() => saveInquiryQuote(id, v))}>
          Save quotation details
        </Button>
      </div>
    </Card>
  );
}

export function InquiryNotes({ inquiryId, notes }: { inquiryId: string; notes: { id: string; body: string; author_email: string | null; created_at: string }[] }) {
  const { pending, run } = useRun();
  const [body, setBody] = useState('');
  return (
    <Card title="Internal notes" icon={StickyNote}>
      <Field label="Add a note (visible to admins only)">
        {({ id }) => <Textarea id={id} rows={3} value={body} maxLength={4000} onChange={(e) => setBody(e.target.value)} />}
      </Field>
      <Button className="mt-3" size="sm" variant="dark" disabled={!body.trim()} loading={pending} onClick={() => run(() => addInquiryNote(inquiryId, body), () => setBody(''))}>
        Add note
      </Button>
      {notes.length > 0 && (
        <ul className="mt-5 space-y-3 border-t border-line pt-5">
          {notes.map((note) => (
            <li key={note.id} className="rounded-md bg-sand/60 p-3">
              <p className="whitespace-pre-line text-[0.9375rem]">{note.body}</p>
              <p className="mt-1.5 text-[0.75rem] text-muted">
                {note.author_email ?? 'Admin'} · {formatDate(note.created_at, true)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
