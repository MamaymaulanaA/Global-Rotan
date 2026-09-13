import { Mail, MessageCircle, MessageSquareText, Package, UserRound } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InquiryControls, InquiryNotes, InquiryQuoteForm } from '@/components/admin/inquiry-controls';
import { AdminPageHeader, Card, formatDate, StatusPill } from '@/components/admin/ui';
import { buttonClasses } from '@/components/ui/button';
import { SmartImage } from '@/components/ui/smart-image';
import { requireAdminPage } from '@/lib/admin/auth';
import { formatIdr, formatUsd, usdToIdr } from '@/lib/currency';
import { whatsappUrl } from '@/lib/whatsapp';

export const metadata: Metadata = { title: 'Inquiry detail' };

const CUSTOMER_TYPE: Record<string, string> = {
  individual: 'Individual',
  retailer: 'Retailer',
  distributor: 'Distributor',
  interior_designer: 'Interior Designer',
  architect: 'Architect',
  hotel_restaurant: 'Hotel or Restaurant',
  project_owner: 'Project Owner',
  other: 'Other',
};

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: inquiry }, { data: items }, { data: notes }] = await Promise.all([
    admin.supabase.from('inquiries').select('*').eq('id', id).maybeSingle(),
    admin.supabase.from('inquiry_items').select('*').eq('inquiry_id', id).order('created_at'),
    admin.supabase.from('inquiry_notes').select('*').eq('inquiry_id', id).order('created_at', { ascending: false }),
  ]);
  if (!inquiry) notFound();
  const q = inquiry as Record<string, string | number | boolean | null> & {
    inquiry_number: string;
    status: string;
    full_name: string;
    email: string;
    phone_country_code: string;
    phone_number: string;
    preferred_language: string;
    is_archived: boolean;
    followed_up_at: string | null;
  };
  const lines = (items ?? []) as {
    id: string;
    product_name_en: string;
    sku: string | null;
    variant_sku: string | null;
    color_name: string | null;
    size_label: string | null;
    finishing: string | null;
    quantity: number;
    note: string | null;
    unit_price_usd: number | null;
    image_url: string | null;
    product_url: string | null;
  }[];
  const phone = `${q.phone_country_code}${q.phone_number}`.replace(/\D/g, '');
  const greeting =
    q.preferred_language === 'id'
      ? `Halo ${q.full_name}, terima kasih atas permintaan penawaran ${q.inquiry_number} di Global Rotan.`
      : `Hello ${q.full_name}, thank you for your quotation request ${q.inquiry_number} with Global Rotan.`;
  const rate = Number(q.exchange_rate_used ?? 0);

  const info: [string, React.ReactNode][] = [
    ['Company', q.company_name || '—'],
    ['Customer type', CUSTOMER_TYPE[String(q.customer_type)] ?? q.customer_type],
    ['Email', <a key="e" href={`mailto:${q.email}`} className="text-gold-ink hover:underline">{q.email}</a>],
    ['WhatsApp / phone', `${q.phone_country_code} ${q.phone_number}`],
    ['Country', q.country],
    ['Shipping destination', q.shipping_destination],
    ['Preferred language', q.preferred_language === 'id' ? 'Bahasa Indonesia' : 'English'],
    ['Preferred currency', q.preferred_currency],
    ['Estimated budget', q.estimated_budget || '—'],
    ['Required delivery date', q.required_delivery_date ? formatDate(String(q.required_delivery_date)) : '—'],
    ['Received', formatDate(String(q.created_at), true)],
    ['Source page', q.source_url ? <span key="s" className="break-all text-[0.8125rem]">{String(q.source_url)}</span> : '—'],
  ];

  return (
    <>
      <AdminPageHeader
        title={q.inquiry_number}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {q.full_name} <StatusPill status={q.status} />
            {q.is_archived && <StatusPill status="archived" label="Archived" />}
            {q.is_demo && <StatusPill status="negotiation" label="Demo" />}
          </span>
        }
        back={{ href: '/admin/inquiries', label: 'Inquiries' }}
        actions={
          <>
            <a
              href={whatsappUrl(phone, greeting)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ size: 'sm', className: 'border-success bg-success px-3 text-white hover:border-success hover:bg-success/90 focus-visible:bg-success/90 sm:px-4 [--color-focus:var(--color-ink)]' })}
            >
              <MessageCircle className="size-4" aria-hidden /> WhatsApp
            </a>
            <a href={`mailto:${q.email}?subject=${encodeURIComponent(`Global Rotan quotation ${q.inquiry_number}`)}`} className={buttonClasses({ variant: 'outline', size: 'sm', className: 'px-3 sm:px-4' })}>
              <Mail className="size-4" aria-hidden /> Email
            </a>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card title={`Requested products (${lines.length})`} icon={Package}>
            <ul className="divide-y divide-line">
              {lines.map((line) => (
                <li key={line.id} className="grid grid-cols-[56px_minmax(0,1fr)_auto] gap-3 py-4 first:pt-0 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:gap-4">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-line bg-sand">
                    <SmartImage src={line.image_url} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {line.product_url ? (
                        <a href={line.product_url} target="_blank" rel="noopener noreferrer" className="hover:text-gold-ink">
                          {line.product_name_en}
                        </a>
                      ) : (
                        line.product_name_en
                      )}
                    </p>
                    <p className="text-[0.8125rem] text-muted">
                      SKU {line.variant_sku ?? line.sku ?? '—'}
                      {line.color_name && ` · Color: ${line.color_name}`}
                      {line.size_label && ` · Size: ${line.size_label}`}
                      {line.finishing && ` · Finishing: ${line.finishing}`}
                    </p>
                    {line.note && <p className="mt-1.5 rounded-sm bg-sand/70 px-2 py-1 text-[0.8125rem]">Note: {line.note}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">× {line.quantity}</p>
                    <p className="text-[0.8125rem] text-muted tabular-nums">
                      {line.unit_price_usd != null ? `${formatUsd(Number(line.unit_price_usd))} ea` : 'Price on request'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-line pt-4 text-[0.9375rem]">
              <span className="text-muted">Estimated value (indicative, at submission)</span>
              <span className="font-semibold tabular-nums">
                {q.estimated_total_usd != null ? formatUsd(Number(q.estimated_total_usd)) : '—'}
                {q.estimated_total_usd != null && rate > 0 && <span className="ml-2 font-normal text-muted">≈ {formatIdr(usdToIdr(Number(q.estimated_total_usd), rate))}</span>}
              </span>
            </div>
          </Card>

          <Card title="Customer message" icon={MessageSquareText}>
            <dl className="space-y-4">
              <div>
                <dt className="text-[0.8125rem] text-muted">Customization request</dt>
                <dd className="mt-1 whitespace-pre-line">{q.customization_request || '—'}</dd>
              </div>
              <div>
                <dt className="text-[0.8125rem] text-muted">Additional message</dt>
                <dd className="mt-1 whitespace-pre-line">{q.message || '—'}</dd>
              </div>
            </dl>
          </Card>

          <InquiryNotes inquiryId={id} notes={(notes ?? []) as { id: string; body: string; author_email: string | null; created_at: string }[]} />
        </div>

        <div className="space-y-6">
          <InquiryControls id={id} status={q.status} archived={q.is_archived} followedUpAt={q.followed_up_at} />
          <InquiryQuoteForm
            id={id}
            defaults={{
              quoted_price: q.quoted_price == null ? '' : String(q.quoted_price),
              quoted_currency: (q.quoted_currency as 'USD' | 'IDR' | null) ?? (q.preferred_currency as 'USD' | 'IDR'),
              shipping_estimate: q.shipping_estimate == null ? '' : String(q.shipping_estimate),
              quoted_moq: q.quoted_moq == null ? '' : String(q.quoted_moq),
            }}
          />
          <Card title="Customer details" icon={UserRound}>
            <dl className="space-y-3">
              {info.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[0.75rem] uppercase tracking-[0.05em] text-muted">{label}</dt>
                  <dd className="break-words text-[0.9375rem] text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
