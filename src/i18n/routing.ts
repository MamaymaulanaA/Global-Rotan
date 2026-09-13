import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'id'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  // English is the default for international visitors; the browser language is not used.
  // A saved preference (NEXT_LOCALE cookie) is applied in src/proxy.ts.
  localeDetection: false,
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365,
  },
});
