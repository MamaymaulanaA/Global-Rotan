import type { Metadata } from 'next';
import Link from 'next/link';
import { SettingsGroupForm, type SettingSection } from '@/components/admin/settings-group-form';
import { AdminPageHeader } from '@/components/admin/ui';
import { requireAdminPage } from '@/lib/admin/auth';
import { DEFAULT_SETTINGS, SETTINGS_KEYS, type SettingsKey } from '@/lib/settings/defaults';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Settings' };

const TABS: { key: Exclude<SettingsKey, 'content'>; label: string }[] = [
  { key: 'business', label: 'Business & contact' },
  { key: 'localization', label: 'Language & currency' },
  { key: 'announcement', label: 'Announcement bar' },
  { key: 'commerce', label: 'Production & shipping' },
  { key: 'whatsapp', label: 'WhatsApp templates' },
  { key: 'seo', label: 'Default SEO' },
];

const SECTIONS: Record<Exclude<SettingsKey, 'content'>, SettingSection[]> = {
  business: [
    {
      title: 'Business identity',
      fields: [
        { path: 'name', label: 'Business name' },
        { path: 'email', label: 'Public email' },
        {
          path: 'tagline_en',
          label: 'Short description (English)',
          type: 'textarea',
          rows: 2,
        },
        {
          path: 'tagline_id',
          label: 'Short description (Indonesian)',
          type: 'textarea',
          rows: 2,
        },
        {
          path: 'logo_url',
          label: 'Logo (used in structured data; the header uses the built-in wordmark)',
          type: 'image',
        },
        { path: 'favicon_url', label: 'Favicon', type: 'image' },
      ],
    },
    {
      title: 'Contact & WhatsApp',
      description: 'The WhatsApp number is used for every WhatsApp button on the website. Use international format with country code, digits only.',
      fields: [
        {
          path: 'whatsapp',
          label: 'WhatsApp number',
          hint: 'Example: 6281234567890',
        },
        {
          path: 'phone_display',
          label: 'Phone as displayed',
          hint: 'Example: +62 812-3456-7890',
        },
        {
          path: 'address_en',
          label: 'Address (English)',
          type: 'textarea',
          rows: 2,
        },
        {
          path: 'address_id',
          label: 'Address (Indonesian)',
          type: 'textarea',
          rows: 2,
        },
        { path: 'maps_url', label: 'Google Maps link', full: true },
        { path: 'hours_en', label: 'Business hours (English)' },
        { path: 'hours_id', label: 'Business hours (Indonesian)' },
        {
          path: 'is_demo',
          label: 'Contact details are still demo placeholders (shows a notice on the website)',
          type: 'checkbox',
          full: true,
        },
      ],
    },
    {
      title: 'Social media',
      fields: ['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok', 'pinterest'].map((s) => ({
        path: `socials.${s}`,
        label: s[0].toUpperCase() + s.slice(1),
        hint: 'Full profile URL',
      })),
    },
  ],
  localization: [
    {
      title: 'Defaults',
      description: 'English and USD are recommended for international visitors. Visitors can always switch in the header; their choice is remembered.',
      fields: [
        {
          path: 'default_language',
          label: 'Default language (first visit)',
          type: 'select',
          options: [
            { value: 'en', label: 'English' },
            { value: 'id', label: 'Bahasa Indonesia' },
          ],
        },
        {
          path: 'default_currency',
          label: 'Default currency',
          type: 'select',
          options: [
            { value: 'USD', label: 'USD ($)' },
            { value: 'IDR', label: 'IDR (Rp)' },
          ],
        },
        {
          path: 'usd_to_idr',
          label: 'Exchange rate: 1 USD = ? IDR',
          type: 'number',
          hint: 'Used to convert indicative prices to Rupiah (rounded to Rp1.000).',
        },
      ],
    },
  ],
  announcement: [
    {
      title: 'Announcement bar',
      fields: [
        {
          path: 'enabled',
          label: 'Show announcement bar',
          type: 'checkbox',
          full: true,
        },
        { path: 'text_en', label: 'Text (English)' },
        { path: 'text_id', label: 'Text (Indonesian)' },
        {
          path: 'link',
          label: 'Link (optional)',
          hint: 'Internal path such as /custom-furniture',
          full: true,
        },
      ],
    },
  ],
  commerce: [
    {
      title: 'Minimum order, production & shipping',
      description: 'Shown on the Shipping & Export page and product shipping tab.',
      fields: [
        {
          path: 'moq_note_en',
          label: 'Minimum order note (English)',
          type: 'textarea',
        },
        {
          path: 'moq_note_id',
          label: 'Minimum order note (Indonesian)',
          type: 'textarea',
        },
        {
          path: 'production_info_en',
          label: 'Production information (English)',
          type: 'textarea',
        },
        {
          path: 'production_info_id',
          label: 'Production information (Indonesian)',
          type: 'textarea',
        },
        {
          path: 'shipping_info_en',
          label: 'Shipping information (English)',
          type: 'textarea',
        },
        {
          path: 'shipping_info_id',
          label: 'Shipping information (Indonesian)',
          type: 'textarea',
        },
      ],
    },
  ],
  whatsapp: [
    {
      title: 'Message templates',
      description: 'Placeholders — product: {product_name} {sku} {color} {size} {quantity} {url}; after inquiry: {inquiry_number} {name} {items}. Leave empty to use the built-in templates.',
      fields: [
        {
          path: 'general_en',
          label: 'General chat (English)',
          type: 'textarea',
        },
        {
          path: 'general_id',
          label: 'General chat (Indonesian)',
          type: 'textarea',
        },
        {
          path: 'product_en',
          label: 'Product page (English)',
          type: 'textarea',
          rows: 6,
        },
        {
          path: 'product_id',
          label: 'Product page (Indonesian)',
          type: 'textarea',
          rows: 6,
        },
        {
          path: 'inquiry_en',
          label: 'After sending an inquiry (English)',
          type: 'textarea',
          rows: 5,
        },
        {
          path: 'inquiry_id',
          label: 'After sending an inquiry (Indonesian)',
          type: 'textarea',
          rows: 5,
        },
      ],
    },
  ],
  seo: [
    {
      title: 'Default SEO',
      fields: [
        { path: 'title_en', label: 'Site title (English)' },
        { path: 'title_id', label: 'Site title (Indonesian)' },
        {
          path: 'description_en',
          label: 'Meta description (English)',
          type: 'textarea',
        },
        {
          path: 'description_id',
          label: 'Meta description (Indonesian)',
          type: 'textarea',
        },
        {
          path: 'og_image',
          label: 'Default social sharing image (1200×630)',
          type: 'image',
        },
      ],
    },
  ],
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const admin = await requireAdminPage();
  const { tab } = await searchParams;
  const active = TABS.find((t) => t.key === tab)?.key ?? 'business';
  const { data } = await admin.supabase
    .from('site_settings')
    .select('key, value')
    .in('key', [...SETTINGS_KEYS]);
  const stored = Object.fromEntries(((data ?? []) as { key: string; value: Record<string, unknown> }[]).map((r) => [r.key, r.value]));
  const initial = {
    ...(DEFAULT_SETTINGS[active] as unknown as Record<string, unknown>),
    ...(stored[active] ?? {}),
  };
  if (active === 'business')
    initial.socials = {
      ...((DEFAULT_SETTINGS.business.socials as Record<string, unknown>) ?? {}),
      ...((stored.business?.socials as Record<string, unknown>) ?? {}),
    };

  return (
    <>
      <AdminPageHeader title="Settings" description="Business information, currency, WhatsApp and default SEO." />
      <nav aria-label="Settings sections" className="scroll-x mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-1 border-b border-line">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin/settings?tab=${t.key}`}
              aria-current={active === t.key ? 'page' : undefined}
              className={cn(
                '-mb-px inline-flex min-h-control-sm shrink-0 items-center whitespace-nowrap rounded-t-md border px-4 text-[0.9375rem] transition-colors',
                active === t.key ? 'border-line border-b-canvas bg-canvas font-semibold text-ink' : 'border-transparent text-muted hover:bg-hover-soft hover:text-ink',
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
      <SettingsGroupForm key={active} settingsKey={active} initial={initial} sections={SECTIONS[active]} />
    </>
  );
}
