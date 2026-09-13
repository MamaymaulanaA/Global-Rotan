'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useHydrated } from '@/hooks/use-hydrated';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/stores/favorites';

export function FavoriteButton({
  productId,
  productName,
  variant = 'surface',
  withLabel = false,
  className,
}: {
  productId: string;
  productName: string;
  variant?: 'surface' | 'outline';
  withLabel?: boolean;
  className?: string;
}) {
  const t = useTranslations('product');
  const hydrated = useHydrated();
  const active = useFavorites((s) => s.ids.includes(productId));
  const toggle = useFavorites((s) => s.toggle);
  const isActive = hydrated && active;
  const label = isActive ? t('removeFavorite') : t('addFavorite');

  const onClick = () => {
    const added = toggle(productId);
    toast.success(added ? t('favoriteAdded') : t('favoriteRemoved'), { description: productName, duration: 2200 });
  };

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isActive}
        className={cn(
          'inline-flex min-h-12 items-center justify-center gap-2 rounded-md border px-5 text-[0.9375rem] font-semibold transition-colors duration-200',
          isActive ? 'border-gold bg-gold-soft text-ink' : 'border-line-strong text-ink hover:border-ink',
          className,
        )}
      >
        <Heart className={cn('size-5', isActive && 'fill-gold text-gold-ink')} strokeWidth={1.75} aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={`${label}: ${productName}`}
      title={label}
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-full transition-colors duration-200',
        variant === 'surface' ? 'border-line bg-surface/95 text-ink hover:border-line-strong hover:bg-surface focus-visible:bg-surface' : 'border-field-border text-ink hover:border-field-border-hover focus-visible:bg-hover-soft',
        className,
      )}
    >
      <Heart className={cn('size-5 transition-colors', isActive && 'fill-gold text-gold-ink')} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
