import { NextResponse, type NextRequest } from 'next/server';
import { getAdmin } from '@/lib/admin/auth';
import { buildInquiryQuery } from '@/lib/admin/inquiry-query';

function csvCell(value: unknown) {
  if (value == null) return '';
  let text = String(value);
  // Prevent spreadsheet formula injection
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sp = Object.fromEntries(request.nextUrl.searchParams.entries());
  const { data, error } = await buildInquiryQuery(
    admin,
    sp,
    'inquiry_number, created_at, status, full_name, company_name, email, phone_country_code, phone_number, country, customer_type, shipping_destination, preferred_language, preferred_currency, estimated_budget, required_delivery_date, estimated_total_usd, quoted_price, quoted_currency, shipping_estimate, quoted_moq, followed_up_at, customization_request, message, items:inquiry_items(product_name_en, sku, color_name, size_label, quantity)',
  ).limit(5000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = [
    'Inquiry number', 'Created at', 'Status', 'Full name', 'Company', 'Email', 'Phone', 'Country', 'Customer type', 'Shipping destination',
    'Language', 'Currency', 'Budget', 'Delivery date', 'Estimated total USD', 'Quoted price', 'Quoted currency', 'Shipping estimate', 'Quoted MOQ',
    'Followed up at', 'Products', 'Customization', 'Message',
  ];
  const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => {
    const items = (r.items as { product_name_en: string; sku: string | null; color_name: string | null; size_label: string | null; quantity: number }[]) ?? [];
    return [
      r.inquiry_number, r.created_at, r.status, r.full_name, r.company_name, r.email, `${r.phone_country_code} ${r.phone_number}`, r.country, r.customer_type,
      r.shipping_destination, r.preferred_language, r.preferred_currency, r.estimated_budget, r.required_delivery_date, r.estimated_total_usd, r.quoted_price,
      r.quoted_currency, r.shipping_estimate, r.quoted_moq, r.followed_up_at,
      items.map((i) => `${i.product_name_en} (${i.sku ?? '-'}${i.color_name ? `, ${i.color_name}` : ''}${i.size_label ? `, ${i.size_label}` : ''}) x${i.quantity}`).join(' | '),
      r.customization_request, r.message,
    ].map(csvCell).join(',');
  });

  const csv = `﻿${[header.join(','), ...rows].join('\r\n')}`;
  const filename = `global-rotan-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  await admin.supabase.from('activity_logs').insert({
    actor_id: admin.user.id,
    actor_email: admin.user.email,
    action: 'export',
    entity_type: 'inquiry',
    summary: `Exported ${rows.length} inquiries to CSV`,
  });
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
