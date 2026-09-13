'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/types/domain';

/**
 * Applies the admin-configured default language for first-time visitors
 * (no saved preference yet). Returning visitors keep their own choice.
 */
export function LocaleBootstrap({ locale, defaultLanguage }: { locale: Locale; defaultLanguage: Locale }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('gr-locale');
    } catch {
      saved = null;
    }
    const hasCookie = document.cookie.split('; ').some((c) => c.startsWith('NEXT_LOCALE='));
    if (!saved) {
      try {
        localStorage.setItem('gr-locale', hasCookie ? locale : defaultLanguage);
      } catch {
        // ignore
      }
      if (!hasCookie && defaultLanguage !== locale && locale === 'en') {
        router.replace(pathname, { locale: defaultLanguage });
      }
    }
    // Run once per full page load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
