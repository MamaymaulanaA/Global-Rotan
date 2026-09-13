import { MessageSquare, SearchX } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageActions } from '@/components/admin/message-actions';
import { QuerySearch } from '@/components/admin/query-search';
import { AdminPageHeader, EmptyPanel, FilterBar, formatDate, Pager, StatusPill } from '@/components/admin/ui';
import { buttonClasses } from '@/components/ui/button';
import { Select } from '@/components/ui/form';
import { requireAdminPage } from '@/lib/admin/auth';
import { MESSAGE_STATUSES } from '@/types/domain';

export const metadata: Metadata = { title: 'Messages' };
const PAGE_SIZE = 20;
const TOPIC: Record<string, string> = { general: 'General question', product: 'Product question', project: 'Project / custom', export: 'Export & shipping' };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const admin = await requireAdminPage();
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  let query = admin.supabase
    .from('contact_messages')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (sp.status && (MESSAGE_STATUSES as readonly string[]).includes(sp.status)) query = query.eq('status', sp.status);
  else query = query.neq('status', 'archived');
  if (sp.q) {
    const term = sp.q.replace(/[%_*\\(),."']/g, ' ').trim();
    if (term) query = query.or(['full_name', 'email', 'subject', 'message', 'company_name'].map((c) => `${c}.ilike.%${term}%`).join(','));
  }
  const { data, count, error } = await query;
  const rows = (data ?? []) as {
    id: string;
    topic: string;
    full_name: string;
    email: string;
    phone: string | null;
    company_name: string | null;
    country: string | null;
    subject: string | null;
    message: string;
    product_url: string | null;
    status: string;
    is_demo: boolean;
    locale: string;
    created_at: string;
  }[];

  return (
    <>
      <AdminPageHeader title="Messages" description="Questions sent through the contact form. These are not real-time chats — reply by email or WhatsApp." />
      <FilterBar>
        <QuerySearch id="msg-q" label="Search messages" defaultValue={sp.q} placeholder="Search name, email, subject or message" className="col-span-2 md:w-auto md:flex-1" />
        <label htmlFor="msg-status" className="sr-only">
          Status
        </label>
        <Select id="msg-status" name="status" defaultValue={sp.status ?? ''} controlSize="sm" className="md:w-52">
          <option value="">Open (not archived)</option>
          {MESSAGE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </Select>
        <button type="submit" className={buttonClasses({ variant: 'dark', size: 'sm' })}>
          Apply
        </button>
      </FilterBar>
      {error && <p className="mb-4 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-danger">{error.message}</p>}

      {rows.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          {sp.q || sp.status ? (
            <EmptyPanel
              icon={SearchX}
              title="No messages match these filters"
              description="Try another keyword or status."
              action={
                <Link href="/admin/messages" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
                  Clear filters
                </Link>
              }
            />
          ) : (
            <EmptyPanel icon={MessageSquare} title="No messages yet" description="Questions sent through the contact form will appear here." />
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((m) => (
            <li key={m.id} className={`rounded-lg border bg-surface ${m.status === 'new' ? 'border-gold/60' : 'border-line'}`}>
              <details className="group" open={m.status === 'new'}>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-transparent px-4 py-4 transition-colors hover:bg-[#faf7f1] sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">
                      {m.full_name}
                      {m.company_name && <span className="font-normal text-muted"> · {m.company_name}</span>}
                    </p>
                    <p className="truncate text-[0.875rem] text-muted">{m.subject || m.message.slice(0, 90)}</p>
                  </div>
                  <span className="text-[0.8125rem] text-muted">{TOPIC[m.topic] ?? m.topic}</span>
                  <StatusPill status={m.status} />
                  {m.is_demo && <StatusPill status="negotiation" label="Demo" />}
                  <span className="whitespace-nowrap text-[0.8125rem] text-muted">{formatDate(m.created_at, true)}</span>
                </summary>
                <div className="border-t border-line px-5 py-4">
                  <p className="whitespace-pre-line text-[0.9375rem] text-ink">{m.message}</p>
                  <dl className="mt-4 grid gap-2 text-[0.875rem] sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-muted">Email</dt>
                      <dd>
                        <a href={`mailto:${m.email}`} className="break-all text-gold-ink hover:underline">
                          {m.email}
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Phone</dt>
                      <dd>{m.phone || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Country</dt>
                      <dd>{m.country || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Language</dt>
                      <dd>{m.locale === 'id' ? 'Bahasa Indonesia' : 'English'}</dd>
                    </div>
                    {m.product_url && (
                      <div className="sm:col-span-2 lg:col-span-4">
                        <dt className="text-muted">Product</dt>
                        <dd>
                          <Link href={m.product_url} target="_blank" className="break-all text-gold-ink hover:underline">
                            {m.product_url}
                          </Link>
                        </dd>
                      </div>
                    )}
                  </dl>
                  <MessageActions id={m.id} status={m.status} email={m.email} phone={m.phone} subject={m.subject} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
      <Pager
        page={page}
        pageCount={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))}
        hrefFor={(p) => `/admin/messages?${new URLSearchParams({ ...(sp.status ? { status: sp.status } : {}), ...(sp.q ? { q: sp.q } : {}), page: String(p) }).toString()}`}
      />
    </>
  );
}
