'use client';

import { ClipboardList, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useHydrated } from '@/hooks/use-hydrated';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/stores/favorites';
import { useInquiry } from '@/stores/inquiry';

function CountLink({ href, label, count, children, className }: { href: string; label: string; count: number; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cn('relative inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-transparent text-ink transition-colors duration-200 hover:bg-hover-soft focus-visible:bg-hover-soft', className)}
    >
      {children}
      {count > 0 && (
        <span
          aria-hidden
          className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[11px] font-semibold leading-none text-ink"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

export function FavoritesLink({ className }: { className?: string }) {
  const t = useTranslations('header');
  const hydrated = useHydrated();
  const count = useFavorites((s) => s.ids.length);
  const value = hydrated ? count : 0;
  return (
    <CountLink href="/favorites" label={t('favoritesLabel', { count: value })} count={value} className={className}>
      <Heart className="size-[22px]" strokeWidth={1.75} aria-hidden />
    </CountLink>
  );
}

export function InquiryLink({ className }: { className?: string }) {
  const t = useTranslations('header');
  const hydrated = useHydrated();
  const count = useInquiry((s) => s.items.length);
  const value = hydrated ? count : 0;
  return (
    <CountLink href="/inquiry" label={t('cartLabel', { count: value })} count={value} className={className}>
      <ClipboardList className="size-[22px]" strokeWidth={1.75} aria-hidden />
    </CountLink>
  );
}
