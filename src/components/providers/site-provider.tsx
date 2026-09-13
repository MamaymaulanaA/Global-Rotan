'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CURRENCY_COOKIE, formatMoney, formatPrice } from '@/lib/currency';
import type { Currency, Locale } from '@/types/domain';
import type { WhatsappTemplates } from '@/types/settings';

export interface PublicSiteConfig {
  businessName: string;
  whatsapp: string;
  email: string;
  usdToIdr: number;
  whatsappTemplates: WhatsappTemplates;
  defaultLanguage: Locale;
  isDemoContact: boolean;
}

interface SiteContextValue extends PublicSiteConfig {
  locale: Locale;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  format: (usd: number | null | undefined, idrOverride?: number | null, quantity?: number) => string | null;
  formatAmount: (amount: number) => string;
}

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({
  children,
  locale,
  initialCurrency,
  config,
}: {
  children: ReactNode;
  locale: Locale;
  initialCurrency: Currency;
  config: PublicSiteConfig;
}) {
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next);
    document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    try {
      localStorage.setItem('gr-currency', next);
    } catch {
      // storage unavailable
    }
  }, []);

  const value = useMemo<SiteContextValue>(
    () => ({
      ...config,
      locale,
      currency,
      setCurrency,
      format: (usd, idrOverride, quantity) => formatPrice(usd, currency, config.usdToIdr, idrOverride, quantity),
      formatAmount: (amount) => formatMoney(amount, currency),
    }),
    [config, locale, currency, setCurrency],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside <SiteProvider>');
  return ctx;
}
