'use client';

import { useTranslations } from 'next-intl';
import { useSite } from '@/components/providers/site-provider';
import { hasVisiblePrice } from '@/lib/currency';
import { cn } from '@/lib/utils';
import type { PriceDisplayType } from '@/types/domain';

interface PriceTagProps {
  usd: number | null;
  idr?: number | null;
  type: PriceDisplayType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  layout?: 'stacked' | 'inline';
}

export function PriceTag({ usd, idr, type, size = 'sm', className, layout = 'stacked' }: PriceTagProps) {
  const t = useTranslations('price');
  const { format } = useSite();

  if (!hasVisiblePrice(type, usd)) {
    return (
      <p className={cn('font-semibold text-gold-ink', size === 'lg' ? 'text-lg' : 'text-[0.9375rem]', className)}>
        {t(type === 'wholesale_request' ? 'wholesale_request' : 'contact')}
      </p>
    );
  }

  const value = format(usd, idr);
  const valueClass = {
    sm: 'text-[1.0625rem]',
    md: 'text-xl',
    lg: 'text-[1.75rem] leading-tight',
  }[size];

  return (
    <p className={cn(layout === 'stacked' ? 'flex flex-col' : 'flex flex-wrap items-baseline gap-x-2', className)}>
      <span className="text-[0.78rem] font-medium uppercase tracking-[0.08em] text-muted">{t(type)}</span>
      <span className={cn('font-semibold tabular-nums text-ink', valueClass)}>{value}</span>
    </p>
  );
}
