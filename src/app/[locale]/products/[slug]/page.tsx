import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { ProductDetailView } from '@/components/product/product-detail-view';
import { ProductGrid } from '@/components/product/product-grid';
import { RecentlyViewed } from '@/components/product/recently-viewed';
import { ResponsiveTabs } from '@/components/ui/tabs';
import { Breadcrumbs } from '@/components/ui/page-header';
import { getProductBySlug, getRelatedProducts } from '@/lib/data/catalog';
import { getSiteSettings } from '@/lib/data/settings';
import { hasVisiblePrice } from '@/lib/currency';
import { jsonLd, pageMetadata } from '@/lib/seo';
import { cmToInch, formatDims, kgToLb, localePath, localized, siteUrl } from '@/lib/utils';
import type { Locale, ProductCardData } from '@/types/domain';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) return { title: 'Not found', robots: { index: false } };
  const primary = product.images.find((i) => i.color_id == null) ?? product.images[0];
  return pageMetadata({
    locale,
    path: `/products/${product.slug}`,
    title: localized(product, 'seo_title', locale) || localized(product, 'name', locale),
    description: localized(product, 'meta_description', locale) || localized(product, 'short_description', locale),
    image: primary?.url,
  });
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="prose-rotan max-w-3xl text-[0.9375rem] leading-relaxed lg:text-base">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

function SpecTable({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="max-w-3xl divide-y divide-line border-y border-line">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,220px)_1fr] sm:gap-6">
          <dt className="text-[0.875rem] text-muted">{label}</dt>
          <dd className="text-[0.9375rem] text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [t, ta, tu, tm, tn, settings] = await Promise.all([
    getTranslations('product'),
    getTranslations('availability'),
    getTranslations('usage'),
    getTranslations('materials'),
    getTranslations('nav'),
    getSiteSettings(),
  ]);
  const related: ProductCardData[] = await getRelatedProducts(product, 4).catch(() => []);

  const name = localized(product, 'name', locale);
  const leadTime =
    product.lead_time_min_weeks != null && product.lead_time_max_weeks != null
      ? product.lead_time_min_weeks === product.lead_time_max_weeks
        ? ta('leadTimeSingle', { weeks: product.lead_time_max_weeks })
        : ta('leadTimeRange', { min: product.lead_time_min_weeks, max: product.lead_time_max_weeks })
      : ta('leadTimeOnRequest');
  const materialList = product.materials.map((m) => tm(m)).join(', ');
  const cm = formatDims(product, 'cm');
  const inch = formatDims(product, 'in');

  const specRows: [string, ReactNode][] = [
    [t('spec.sku'), product.sku],
    ...(product.category ? [[t('spec.category'), localized(product.category, 'name', locale)] as [string, ReactNode]] : []),
    ...(product.collection ? [[t('spec.collection'), localized(product.collection, 'name', locale)] as [string, ReactNode]] : []),
    [t('spec.materials'), materialList || '—'],
    ...(localized(product, 'finishing', locale) ? [[t('spec.finishing'), localized(product, 'finishing', locale)] as [string, ReactNode]] : []),
    [t('spec.usage'), tu(product.usage)],
    ...(cm ? [[t('spec.dimensions'), `${cm} · ${inch}`] as [string, ReactNode]] : []),
    ...(product.seat_height_cm ? [[t('spec.seatHeight'), `${Number(product.seat_height_cm)} cm · ${cmToInch(Number(product.seat_height_cm))} in`] as [string, ReactNode]] : []),
    ...(product.weight_kg ? [[t('spec.weight'), `${Number(product.weight_kg)} kg · ${kgToLb(Number(product.weight_kg))} lb`] as [string, ReactNode]] : []),
    [t('spec.moq'), t('moqValue', { count: product.moq })],
    [t('spec.leadTime'), leadTime],
    [t('spec.availability'), ta(product.availability)],
    ...product.specs.map((s) => [localized(s, 'label', locale), localized(s, 'value', locale)] as [string, ReactNode]),
  ];

  const sizeRows = product.sizes.length
    ? product.sizes
    : cm
      ? [{ id: 'base', label_en: name, label_id: name, width_cm: product.width_cm, depth_cm: product.depth_cm, height_cm: product.height_cm, product_id: product.id, sort_order: 0 }]
      : [];

  const tabs = [
    { id: 'description', label: t('tabs.description'), content: <Paragraphs text={localized(product, 'description', locale) || localized(product, 'short_description', locale)} /> },
    { id: 'specifications', label: t('tabs.specifications'), content: <SpecTable rows={specRows} /> },
    {
      id: 'dimensions',
      label: t('tabs.dimensions'),
      content: (
        <div className="max-w-3xl">
          {sizeRows.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[420px] text-left text-[0.9375rem]">
                <caption className="sr-only">{t('sizeTable')}</caption>
                <thead className="bg-sand text-[0.8125rem] text-ink-soft">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      {t('sizeName')}
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      {t('inCm')} (W × D × H)
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      {t('inInch')} (W × D × H)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-surface">
                  {sizeRows.map((s) => (
                    <tr key={s.id}>
                      <th scope="row" className="px-4 py-3 font-medium text-ink">
                        {localized(s, 'label', locale)}
                      </th>
                      <td className="px-4 py-3 tabular-nums">{formatDims(s, 'cm') ?? '—'}</td>
                      <td className="px-4 py-3 tabular-nums">{formatDims(s, 'in') ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-[0.8125rem] text-muted">{t('dimensionNote')}</p>
        </div>
      ),
    },
    {
      id: 'materials',
      label: t('tabs.materials'),
      content: (
        <div className="max-w-3xl space-y-4">
          {localized(product, 'material_detail', locale) && <Paragraphs text={localized(product, 'material_detail', locale)} />}
          <ul className="flex flex-wrap gap-2">
            {product.materials.map((m) => (
              <li key={m} className="rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-[0.875rem] text-ink-soft">
                {tm(m)}
              </li>
            ))}
          </ul>
          {localized(product, 'finishing', locale) && (
            <p className="text-[0.9375rem]">
              <span className="font-semibold text-ink">{t('spec.finishing')}:</span> {localized(product, 'finishing', locale)}
            </p>
          )}
        </div>
      ),
    },
    { id: 'care', label: t('tabs.care'), content: <Paragraphs text={localized(product, 'care', locale) || t('careDefault')} /> },
    { id: 'customization', label: t('tabs.customization'), content: <Paragraphs text={localized(product, 'customization', locale) || t('customizationDefault')} /> },
    {
      id: 'shipping',
      label: t('tabs.shipping'),
      content: (
        <div className="max-w-3xl space-y-4">
          <Paragraphs text={localized(settings.commerce, 'shipping_info', locale) ? `${localized(settings.commerce, 'shipping_info', locale)}\n\n${t('shippingDefault')}` : t('shippingDefault')} />
        </div>
      ),
    },
  ];

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    sku: product.sku,
    description: localized(product, 'short_description', locale),
    image: product.images.slice(0, 5).map((i) => (i.url.startsWith('http') ? i.url : siteUrl(i.url))),
    brand: { '@type': 'Brand', name: settings.business.name },
    category: product.category ? localized(product.category, 'name', locale) : undefined,
    material: materialList || undefined,
    url: siteUrl(localePath(locale, `/products/${product.slug}`)),
    ...(hasVisiblePrice(product.price_display_type, product.base_price_usd)
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price: product.base_price_usd,
            availability: product.availability === 'ready_stock' ? 'https://schema.org/InStock' : 'https://schema.org/MadeToOrder',
            url: siteUrl(localePath(locale, `/products/${product.slug}`)),
            seller: { '@type': 'Organization', name: settings.business.name },
          },
        }
      : {}),
  };

  return (
    <>
      <div className="container-page pb-4 pt-6 lg:pt-8">
        <Breadcrumbs
          locale={locale}
          items={[
            { label: tn('products'), href: '/products' },
            ...(product.category ? [{ label: localized(product.category, 'name', locale), href: `/products?category=${product.category.slug}` }] : []),
            { label: name },
          ]}
        />
      </div>
      <div className="container-page pb-14 pt-4 lg:pb-20">
        <ProductDetailView product={product} siteOrigin={siteUrl()} />
      </div>

      <section className="border-t border-line bg-surface">
        <div className="container-page py-10 lg:py-14">
          <ResponsiveTabs items={tabs} />
        </div>
      </section>

      <div className="container-page">
        {related.length > 0 && (
          <section className="py-14 lg:py-20" aria-labelledby="related-products">
            <h2 id="related-products" className="text-h2">
              {t('related')}
            </h2>
            <ProductGrid products={related} className="mt-8 lg:mt-10" />
          </section>
        )}
        <RecentlyViewed excludeId={product.id} />
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(productLd)} />
    </>
  );
}
