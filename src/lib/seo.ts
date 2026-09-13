import type { Metadata } from 'next';
import { localePath, siteUrl } from '@/lib/utils';
import type { Locale } from '@/types/domain';

export function alternates(path: string, locale: Locale) {
  return {
    canonical: siteUrl(localePath(locale, path)),
    languages: {
      en: siteUrl(localePath('en', path)),
      id: siteUrl(localePath('id', path)),
      'x-default': siteUrl(localePath('en', path)),
    },
  };
}

export function pageMetadata({
  locale,
  path,
  title,
  description,
  image,
  noIndex,
}: {
  locale: Locale;
  path: string;
  title: string;
  description?: string;
  image?: string | null;
  noIndex?: boolean;
}): Metadata {
  const url = siteUrl(localePath(locale, path));
  const ogImage = image ? (image.startsWith('http') ? image : siteUrl(image)) : siteUrl('/demo/site/og-default.svg');
  return {
    title,
    description,
    alternates: alternates(path, locale),
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: 'Global Rotan',
      locale: locale === 'id' ? 'id_ID' : 'en_US',
      alternateLocale: locale === 'id' ? ['en_US'] : ['id_ID'],
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex ? { index: false, follow: true } : undefined,
  };
}

export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
