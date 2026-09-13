'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/misc';
import type { BadgeKey } from '@/lib/product';

const tones: Record<BadgeKey, 'dark' | 'gold' | 'success' | 'outline' | 'neutral'> = {
  new: 'dark',
  featured: 'gold',
  best_seller: 'gold',
  ready_stock: 'success',
  made_to_order: 'outline',
};

export function ProductBadges({ badges, className }: { badges: BadgeKey[]; className?: string }) {
  const t = useTranslations('badges');
  if (!badges.length) return null;
  return (
    <div className={className}>
      {badges.map((badge) => (
        <Badge key={badge} tone={tones[badge]}>
          {t(badge)}
        </Badge>
      ))}
    </div>
  );
}
