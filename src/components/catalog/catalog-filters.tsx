'use client';

import { ChevronDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { useSite } from '@/components/providers/site-provider';
import type { CatalogFilters } from '@/lib/catalog-params';
import { PRICE_BUCKETS, convertPrice, formatMoney, type PriceBucketKey } from '@/lib/currency';
import { cn, localized } from '@/lib/utils';
import { COLOR_FAMILIES, MATERIALS, type Category, type Collection, type Locale } from '@/types/domain';

const FAMILY_SWATCH: Record<string, string> = {
  natural: '#D2AE78',
  honey: '#C89B5E',
  brown: '#7E5636',
  black: '#37322D',
  white: '#EFE8DA',
  grey: '#A89F92',
  green: '#7D8964',
  blue: '#5B7A8C',
  other: 'conic-gradient(#C89B5E, #7D8964, #5B7A8C, #C68B6E, #C89B5E)',
};

function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-4 first:pt-0">
      <h3 className="font-sans">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-[0.9375rem] font-semibold text-ink"
        >
          {title}
          <ChevronDown className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
        </button>
      </h3>
      {open && <div className="pt-1">{children}</div>}
    </div>
  );
}

function CheckRow({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: ReactNode; count?: number }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm text-[0.9375rem] text-ink-soft hover:text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-[18px] shrink-0 accent-[var(--color-espresso)]" />
      <span className="flex-1">{label}</span>
      {count != null && <span className="text-[0.8125rem] tabular-nums text-muted">{count}</span>}
    </label>
  );
}

function RadioRow({ name, checked, onChange, label }: { name: string; checked: boolean; onChange: () => void; label: ReactNode }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem] text-ink-soft hover:text-ink">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="size-[18px] shrink-0 accent-[var(--color-espresso)]" />
      <span>{label}</span>
    </label>
  );
}

export function CatalogFilterPanel({
  filters,
  categories,
  collections,
  update,
  idPrefix,
}: {
  filters: CatalogFilters;
  categories: Category[];
  collections: Collection[];
  update: (patch: Partial<CatalogFilters>) => void;
  idPrefix: string;
}) {
  const t = useTranslations('catalog');
  const tm = useTranslations('materials');
  const tcf = useTranslations('colorFamilies');
  const tu = useTranslations('usage');
  const ta = useTranslations('availability');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const { currency, usdToIdr } = useSite();

  const toggle = <K extends 'categories' | 'collections' | 'materials' | 'colors'>(key: K, value: CatalogFilters[K][number]) => {
    const list = filters[key] as string[];
    const next = list.includes(value as string) ? list.filter((v) => v !== value) : [...list, value as string];
    update({ [key]: next } as Partial<CatalogFilters>);
  };

  const money = (usd: number) => formatMoney(convertPrice(usd, currency, usdToIdr), currency);
  const bucketLabel = (key: PriceBucketKey) => {
    const bucket = PRICE_BUCKETS.find((b) => b.key === key)!;
    if (bucket.min === 0) return t('priceUnder', { max: money(bucket.max!) });
    if (bucket.max == null) return t('priceOver', { min: money(bucket.min) });
    return t('priceBetween', { min: money(bucket.min), max: money(bucket.max) });
  };

  return (
    <div>
      <Group title={t('category')}>
        {categories.map((c) => (
          <CheckRow
            key={c.id}
            checked={filters.categories.includes(c.slug)}
            onChange={() => toggle('categories', c.slug)}
            label={localized(c, 'name', locale)}
            count={c.product_count}
          />
        ))}
      </Group>

      {collections.length > 0 && (
        <Group title={t('collection')}>
          {collections.map((c) => (
            <CheckRow
              key={c.id}
              checked={filters.collections.includes(c.slug)}
              onChange={() => toggle('collections', c.slug)}
              label={localized(c, 'name', locale)}
              count={c.product_count}
            />
          ))}
        </Group>
      )}

      <Group title={t('priceRange')}>
        <RadioRow name={`${idPrefix}-price`} checked={!filters.price} onChange={() => update({ price: null })} label={tc('all')} />
        {PRICE_BUCKETS.map((b) => (
          <RadioRow key={b.key} name={`${idPrefix}-price`} checked={filters.price === b.key} onChange={() => update({ price: b.key })} label={bucketLabel(b.key)} />
        ))}
      </Group>

      <Group title={t('material')}>
        {MATERIALS.map((m) => (
          <CheckRow key={m} checked={filters.materials.includes(m)} onChange={() => toggle('materials', m)} label={tm(m)} />
        ))}
      </Group>

      <Group title={t('color')}>
        <div className="grid grid-cols-2 gap-1">
          {COLOR_FAMILIES.map((family) => {
            const active = filters.colors.includes(family);
            return (
              <button
                key={family}
                type="button"
                aria-pressed={active}
                onClick={() => toggle('colors', family)}
                className={cn(
                  'flex min-h-11 items-center gap-2.5 rounded-md border px-2.5 text-left text-[0.875rem] transition-colors',
                  active ? 'border-ink bg-surface text-ink' : 'border-transparent text-ink-soft hover:bg-sand',
                )}
              >
                <span className="size-5 shrink-0 rounded-full border border-black/10" style={{ background: FAMILY_SWATCH[family] }} aria-hidden />
                {tcf(family)}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title={t('usage')}>
        <RadioRow name={`${idPrefix}-usage`} checked={!filters.usage} onChange={() => update({ usage: null })} label={tc('all')} />
        <RadioRow name={`${idPrefix}-usage`} checked={filters.usage === 'indoor'} onChange={() => update({ usage: 'indoor' })} label={tu('indoor')} />
        <RadioRow name={`${idPrefix}-usage`} checked={filters.usage === 'outdoor'} onChange={() => update({ usage: 'outdoor' })} label={tu('outdoor')} />
      </Group>

      <Group title={t('availability')}>
        <RadioRow name={`${idPrefix}-avail`} checked={!filters.availability} onChange={() => update({ availability: null })} label={tc('all')} />
        <RadioRow
          name={`${idPrefix}-avail`}
          checked={filters.availability === 'ready_stock'}
          onChange={() => update({ availability: 'ready_stock' })}
          label={ta('ready_stock')}
        />
        <RadioRow
          name={`${idPrefix}-avail`}
          checked={filters.availability === 'made_to_order'}
          onChange={() => update({ availability: 'made_to_order' })}
          label={ta('made_to_order')}
        />
      </Group>
    </div>
  );
}
