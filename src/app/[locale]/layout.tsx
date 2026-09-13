import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { FloatingContact } from '@/components/layout/floating-contact';
import { Footer } from '@/components/layout/footer';
import { AnnouncementBar, Header } from '@/components/layout/header';
import { QuickViewHost } from '@/components/product/quick-view';
import { LocaleBootstrap } from '@/components/providers/locale-bootstrap';
import { SiteProvider } from '@/components/providers/site-provider';
import { routing } from '@/i18n/routing';
import { CURRENCY_COOKIE, isCurrency } from '@/lib/currency';
import { getSiteSettings } from '@/lib/data/settings';
import { fraunces, workSans } from '@/lib/fonts';
import { alternates } from '@/lib/seo';
import { localized, siteUrl } from '@/lib/utils';
import type { Locale } from '@/types/domain';

export const viewport: Viewport = {
  themeColor: '#faf7f2',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: 'meta' });
  const settings = await getSiteSettings();
  const title = localized(settings.seo, 'title', locale) || t('siteTitle');
  const description = localized(settings.seo, 'description', locale) || t('siteDescription');
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s | ${settings.business.name}` },
    description,
    applicationName: settings.business.name,
    alternates: alternates('/', locale),
    icons: settings.business.favicon_url ? { icon: settings.business.favicon_url } : { icon: '/icon.svg' },
    openGraph: {
      siteName: settings.business.name,
      type: 'website',
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      images: [{ url: settings.seo.og_image || '/demo/site/og-default.svg', width: 1200, height: 630 }],
    },
  };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [settings, cookieStore, t] = await Promise.all([getSiteSettings(), cookies(), getTranslations({ locale, namespace: 'common' })]);
  const cookieCurrency = cookieStore.get(CURRENCY_COOKIE)?.value;
  const currency = isCurrency(cookieCurrency) ? cookieCurrency : settings.localization.default_currency;

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.business.name,
    url: siteUrl(),
    email: settings.business.email,
    logo: settings.business.logo_url || siteUrl('/icon.svg'),
    sameAs: Object.values(settings.business.socials).filter(Boolean),
  };

  return (
    <html lang={locale} className={`${fraunces.variable} ${workSans.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only z-[100] rounded-md bg-espresso px-4 py-3 text-canvas focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {t('skipToContent')}
        </a>
        <NextIntlClientProvider>
          <SiteProvider
            locale={locale as Locale}
            initialCurrency={currency}
            config={{
              businessName: settings.business.name,
              whatsapp: settings.business.whatsapp,
              email: settings.business.email,
              usdToIdr: settings.localization.usd_to_idr,
              whatsappTemplates: settings.whatsapp,
              defaultLanguage: settings.localization.default_language,
              isDemoContact: Boolean(settings.business.is_demo),
            }}
          >
            <AnnouncementBar announcement={settings.announcement} />
            <Header />
            <main id="main" tabIndex={-1}>
              {children}
            </main>
            <Footer settings={settings} />
            <FloatingContact />
            <QuickViewHost />
            <LocaleBootstrap locale={locale as Locale} defaultLanguage={settings.localization.default_language} />
            <Toaster
              position="bottom-center"
              offset={88}
              mobileOffset={88}
              toastOptions={{
                classNames: {
                  toast: '!rounded-md !border-line !bg-surface !text-ink !shadow-none !font-sans',
                  description: '!text-muted',
                  actionButton: '!bg-espresso !text-canvas !rounded-sm !font-semibold',
                },
              }}
            />
          </SiteProvider>
        </NextIntlClientProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd).replace(/</g, '\\u003c') }} />
      </body>
    </html>
  );
}
