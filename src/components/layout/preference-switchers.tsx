'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { useSite } from '@/components/providers/site-provider';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Currency, Locale } from '@/types/domain';

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  tone,
  disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; title: string }[];
  onChange: (value: T) => void;
  tone: 'light' | 'dark';
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label={label} className={cn('inline-flex rounded-md border p-0.5', tone === 'light' ? 'border-field-border bg-surface' : 'on-dark border-white/25')}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            title={option.title}
            disabled={disabled}
            onClick={() => !active && onChange(option.value)}
            className={cn(
              'min-h-11 min-w-11 rounded-[3px] border px-2.5 text-[0.8125rem] font-semibold tracking-[0.04em] transition-colors duration-200',
              tone === 'light'
                ? active
                  ? 'border-espresso bg-espresso text-canvas [--color-focus:var(--color-gold)]'
                  : 'border-transparent text-ink-soft hover:bg-hover-soft'
                : active
                  ? 'border-canvas bg-canvas text-ink [--color-focus:var(--color-gold-ink)]'
                  : 'border-transparent text-canvas/80 hover:bg-white/10',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function LanguageSwitcher({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const t = useTranslations('header');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const change = (next: Locale) => {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    try {
      localStorage.setItem('gr-locale', next);
    } catch {
      // ignore
    }
    const query = searchParams.toString();
    startTransition(() => {
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { locale: next, scroll: false });
    });
  };

  return (
    <Segmented
      label={t('language')}
      value={locale}
      tone={tone}
      disabled={pending}
      onChange={change}
      options={[
        { value: 'en', label: 'EN', title: 'English' },
        { value: 'id', label: 'ID', title: 'Bahasa Indonesia' },
      ]}
    />
  );
}

export function CurrencySwitcher({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const t = useTranslations('header');
  const { currency, setCurrency } = useSite();
  return (
    <Segmented<Currency>
      label={t('currency')}
      value={currency}
      tone={tone}
      onChange={setCurrency}
      options={[
        { value: 'USD', label: 'USD', title: 'US Dollar ($)' },
        { value: 'IDR', label: 'IDR', title: 'Rupiah (Rp)' },
      ]}
    />
  );
}
