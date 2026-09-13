import { Clock, Mail, MapPin, MessageCircle } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Link } from '@/i18n/navigation';
import { getCategories } from '@/lib/data/catalog';
import { localized } from '@/lib/utils';
import { whatsappUrl } from '@/lib/whatsapp';
import type { Locale } from '@/types/domain';
import type { SiteSettings } from '@/types/settings';
import { Logo } from './logo';
import { CurrencySwitcher, LanguageSwitcher } from './preference-switchers';
import { SocialIcons } from './social-icons';

export async function Footer({ settings }: { settings: SiteSettings }) {
  const t = await getTranslations('footer');
  const tn = await getTranslations('nav');
  const locale = (await getLocale()) as Locale;
  const { business } = settings;
  let categories: { slug: string; name: string }[] = [];
  try {
    categories = (await getCategories()).map((c) => ({ slug: c.slug, name: localized(c, 'name', locale) }));
  } catch {
    categories = [];
  }

  const heading = 'mb-4 font-sans text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-gold';
  const linkClass = 'inline-flex min-h-11 min-w-11 items-center text-[0.9375rem] text-canvas/75 transition-colors hover:text-canvas';
  const address = localized(business, 'address', locale);
  const hours = localized(business, 'hours', locale);

  return (
    <footer className="on-dark bg-espresso text-canvas/80">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:py-20">
        <div className="lg:col-span-4">
          <Link href="/" aria-label="Global Rotan" className="inline-flex min-h-11 items-center rounded-sm">
            <Logo tone="light" />
          </Link>
          <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-canvas/70">
            {localized(business, 'tagline', locale) || t('description')}
          </p>
          <div className="mt-6">
            <p className={heading}>{t('follow')}</p>
            <SocialIcons socials={business.socials} className="-ml-3 flex flex-wrap gap-1" />
          </div>
        </div>

        <nav aria-label={t('navigation')} className="lg:col-span-2">
          <p className={heading}>{t('navigation')}</p>
          <ul>
            {[
              ['/', tn('home')],
              ['/products', tn('products')],
              ['/collections', tn('collections')],
              ['/about', tn('about')],
              ['/custom-furniture', tn('customFurniture')],
              ['/export', tn('exportInfo')],
              ['/contact', tn('contact')],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className={linkClass}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t('categories')} className="lg:col-span-2">
          <p className={heading}>{t('categories')}</p>
          <ul>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/products?category=${c.slug}`} className={linkClass}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <p className={heading}>{t('contact')}</p>
          <ul className="space-y-3 text-[0.9375rem]">
            <li>
              <a href={`mailto:${business.email}`} className="flex min-h-11 items-start gap-3 break-all text-canvas/80 hover:text-canvas">
                <Mail className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />
                {business.email}
              </a>
            </li>
            <li>
              <a
                href={whatsappUrl(business.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-start gap-3 text-canvas/80 hover:text-canvas"
              >
                <MessageCircle className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />
                <span>WhatsApp {business.phone_display ?? `+${business.whatsapp}`}</span>
              </a>
            </li>
            {address && (
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />
                {business.maps_url ? (
                  <a href={business.maps_url} target="_blank" rel="noopener noreferrer" className="hover:text-canvas">
                    {address}
                  </a>
                ) : (
                  <span className="whitespace-pre-line">{address}</span>
                )}
              </li>
            )}
            {hours && (
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />
                <span>
                  <span className="sr-only">{t('hours')}: </span>
                  {hours}
                </span>
              </li>
            )}
          </ul>
          <div className="mt-7">
            <p className={heading}>{t('preferences')}</p>
            <div className="flex flex-wrap gap-3">
              <Suspense>
                <LanguageSwitcher tone="dark" />
              </Suspense>
              <CurrencySwitcher tone="dark" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 pb-24 pt-6 text-[0.8125rem] text-canvas/60 lg:flex-row lg:items-center lg:justify-between lg:pb-6">
          <div className="space-y-1">
            <p>{t('rights', { year: new Date().getFullYear() })}</p>
            <p>{t('noPayment')}</p>
            {business.is_demo && <p className="text-gold/90">{t('demoNotice')}</p>}
          </div>
          <ul className="-ml-1 flex flex-wrap gap-x-5">
            {[
              ['/privacy-policy', t('privacy')],
              ['/terms', t('terms')],
              ['/shipping-export', t('shipping')],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-11 items-center px-1 hover:text-canvas">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
