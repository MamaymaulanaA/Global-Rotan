'use client';

import { AlertTriangle, ChevronLeft, ChevronRight, LayoutGrid, Loader2, PencilRuler, RotateCcw, Rows3, Search, SlidersHorizontal, X } from 'lucide-react';import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { ProductCard } from '@/components/product/product-card';
import { useSite } from '@/components/providers/site-provider';
import { Button, ButtonLink, buttonClasses } from '@/components/ui/button';
import { SearchInput, Select } from '@/components/ui/form';
import { Drawer } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/misc';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { countActiveFilters, filtersToSearchParams, SORT_KEYS, type CatalogFilters, type SortKey } from '@/lib/catalog-params';
import { PRICE_BUCKETS, convertPrice, formatMoney } from '@/lib/currency';
import { cn, localized } from '@/lib/utils';
import type { Category, Collection, Locale, ProductCardData } from '@/types/domain';
import { CatalogFilterPanel } from './catalog-filters';

type Density = 'comfortable' | 'compact';

interface CatalogViewProps {
  filters: CatalogFilters;
  categories: Category[];
  collections: Collection[];
  result: { items: ProductCardData[]; total: number; page: number; pageCount: number } | null;
  basePath?: string;
  lockedCollection?: string;
}

export function CatalogView({ filters, categories, collections, result, basePath, lockedCollection }: CatalogViewProps) {
  const t = useTranslations('catalog');
  const tm = useTranslations('materials');
  const tcf = useTranslations('colorFamilies');
  const tu = useTranslations('usage');
  const ta = useTranslations('availability');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const { currency, usdToIdr } = useSite();
  const [pending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState(filters.q);
  const [density, setDensity] = useState<Density>('comfortable');

  useEffect(() => setQuery(filters.q), [filters.q]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gr-grid-density');
      if (saved === 'compact' || saved === 'comfortable') setDensity(saved);
    } catch {
      // ignore
    }
  }, []);

  const path = basePath ?? pathname;

  const navigate = (next: CatalogFilters) => {
    const sp = filtersToSearchParams(lockedCollection ? { ...next, collections: [] } : next);
    const qs = sp.toString();
    startTransition(() => {
      router.replace(`${path}${qs ? `?${qs}` : ''}`, { scroll: false });
    });
  };

  const update = (patch: Partial<CatalogFilters>) => navigate({ ...filters, ...patch, page: patch.page ?? 1 });

  // Debounced search
  useEffect(() => {
    if (query.trim() === filters.q) return;
    const timer = setTimeout(() => update({ q: query.trim() }), 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const reset = () => {
    setQuery('');
    navigate({ q: '', categories: [], collections: [], materials: [], colors: [], usage: null, availability: null, price: null, sort: filters.sort, page: 1 });
  };

  const changeDensity = (value: Density) => {
    setDensity(value);
    try {
      localStorage.setItem('gr-grid-density', value);
    } catch {
      // ignore
    }
  };

  const activeCount = countActiveFilters(filters) - (lockedCollection ? filters.collections.length : 0);

  const chips = useMemo(() => {
    const money = (usd: number) => formatMoney(convertPrice(usd, currency, usdToIdr), currency);
    const list: { key: string; label: string; remove: Partial<CatalogFilters> }[] = [];
    if (filters.q) list.push({ key: 'q', label: `“${filters.q}”`, remove: { q: '' } });
    filters.categories.forEach((slug) => {
      const c = categories.find((x) => x.slug === slug);
      list.push({ key: `c-${slug}`, label: c ? localized(c, 'name', locale) : slug, remove: { categories: filters.categories.filter((s) => s !== slug) } });
    });
    if (!lockedCollection) {
      filters.collections.forEach((slug) => {
        const c = collections.find((x) => x.slug === slug);
        list.push({ key: `k-${slug}`, label: c ? localized(c, 'name', locale) : slug, remove: { collections: filters.collections.filter((s) => s !== slug) } });
      });
    }
    filters.materials.forEach((m) => list.push({ key: `m-${m}`, label: tm(m), remove: { materials: filters.materials.filter((x) => x !== m) } }));
    filters.colors.forEach((c) => list.push({ key: `col-${c}`, label: tcf(c), remove: { colors: filters.colors.filter((x) => x !== c) } }));
    if (filters.usage) list.push({ key: 'usage', label: tu(filters.usage), remove: { usage: null } });
    if (filters.availability) list.push({ key: 'avail', label: ta(filters.availability), remove: { availability: null } });
    if (filters.price) {
      const b = PRICE_BUCKETS.find((x) => x.key === filters.price)!;
      const label = b.min === 0 ? t('priceUnder', { max: money(b.max!) }) : b.max == null ? t('priceOver', { min: money(b.min) }) : t('priceBetween', { min: money(b.min), max: money(b.max) });
      list.push({ key: 'price', label, remove: { price: null } });
    }
    return list;
  }, [filters, categories, collections, locale, currency, usdToIdr, lockedCollection, t, tm, tcf, tu, ta]);

  const pageHref = (page: number) => {
    const sp = filtersToSearchParams({ ...(lockedCollection ? { ...filters, collections: [] } : filters), page });
    const qs = sp.toString();
    return `${path}${qs ? `?${qs}` : ''}`;
  };

  const gridClass =
    density === 'compact'
      ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
      : 'grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3';

  const panel = (prefix: string) => (
    <CatalogFilterPanel
      filters={filters}
      categories={categories}
      collections={lockedCollection ? [] : collections}
      update={update}
      idPrefix={prefix}
    />
  );

  return (
    <div className="container-page py-8 lg:py-12">
      <div className="lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[270px_minmax(0,1fr)] xl:gap-12">
        <aside className="hidden lg:block" aria-label={t('filters')}>
          <div className="sticky top-[140px] max-h-[calc(100dvh-160px)] overflow-y-auto pb-6 pr-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted">{t('filters')}</h2>
              {activeCount > 0 && (
                <button type="button" onClick={reset} className="inline-flex min-h-control-sm items-center rounded-md px-2 text-[0.8125rem] font-semibold text-gold-ink hover:bg-hover-soft">
                  {t('reset')}
                </button>
              )}
            </div>
            {panel('desktop')}
          </div>
        </aside>

        <div className="min-w-0">
          {/* Toolbar: search full width on mobile; filters + sort on the next row */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <form
              role="search"
              className="min-w-0 flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                update({ q: query.trim() });
              }}
            >
              <SearchInput
                id="catalog-search"
                label={t('searchLabel')}
                clearLabel={tc('clear')}
                value={query}
                onValueChange={setQuery}
                placeholder={t('searchPlaceholder')}
              />
            </form>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className={buttonClasses({ variant: 'outline', className: 'flex-1 border-field-border px-4 hover:border-field-border-hover lg:hidden' })}
              >
                <SlidersHorizontal className="size-4" aria-hidden />
                {t('filters')}
                {activeCount > 0 && <span className="rounded-full bg-gold px-2 text-[0.75rem] leading-5 text-ink">{activeCount}</span>}
              </button>
              <label htmlFor="catalog-sort" className="sr-only">
                {t('sortBy')}
              </label>
              <Select
                id="catalog-sort"
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value as SortKey })}
                className="min-w-0 flex-1 md:w-52 md:flex-none"
              >
                {SORT_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {t(`sort.${key}`)}
                  </option>
                ))}
              </Select>
              <div role="group" aria-label={t('gridView')} className="field-group hidden h-control items-center gap-0.5 p-0.5 sm:flex">
                {(
                  [
                    ['comfortable', Rows3, t('gridComfortable')],
                    ['compact', LayoutGrid, t('gridCompact')],
                  ] as const
                ).map(([value, Icon, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={density === value}
                    aria-label={label}
                    title={label}
                    onClick={() => changeDensity(value)}
                    className={cn(
                      'inline-flex h-full w-11 items-center justify-center rounded-[3px] transition-colors',
                      density === value ? 'bg-espresso text-canvas [--color-focus:var(--color-gold)]' : 'text-ink-soft hover:bg-hover-soft',
                    )}
                  >
                    <Icon className="size-[18px]" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result count + chips */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
            <p className="text-[0.9375rem] text-ink-soft" aria-live="polite">
              {result ? (
                <>
                  <span className="font-semibold text-ink">{t('results', { count: result.total })}</span>
                  {filters.q && <span> {t('resultsFor', { q: filters.q })}</span>}
                </>
              ) : null}
            </p>
            {pending && (
              <span className="inline-flex items-center gap-2 text-[0.8125rem] text-muted" role="status">
                <Loader2 className="size-4 animate-spin" aria-hidden /> {t('loading')}
              </span>
            )}
          </div>
          {chips.length > 0 && (
            <div className="scroll-x -mx-1 mt-3 flex items-center gap-2 px-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" aria-label={t('activeFilters')}>
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => {
                    if (chip.key === 'q') setQuery('');
                    update(chip.remove);
                  }}
                  aria-label={t('removeFilter', { label: chip.label })}
                  className="inline-flex min-h-control-sm shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-field-border bg-surface py-1 pl-3.5 pr-2.5 text-[0.8125rem] text-ink transition-colors hover:border-field-border-hover"
                >
                  {chip.label}
                  <X className="size-3.5" aria-hidden />
                </button>
              ))}
              <button type="button" onClick={reset} className="inline-flex min-h-control-sm shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[0.8125rem] font-semibold text-gold-ink hover:bg-hover-soft">
                <RotateCcw className="size-3.5" aria-hidden /> {t('reset')}
              </button>
            </div>
          )}

          {/* Results */}
          <div className={cn('mt-8 transition-opacity duration-200', pending && 'pointer-events-none opacity-50')} aria-busy={pending}>
            {!result ? (
              <EmptyState
                icon={<AlertTriangle className="size-6" aria-hidden />}
                title={t('errorTitle')}
                description={t('errorText')}
                action={
                  <Button variant="outline" onClick={() => startTransition(() => router.refresh())} icon={<RotateCcw className="size-4" aria-hidden />}>
                    {tc('retry')}
                  </Button>
                }
              />
            ) : result.items.length === 0 ? (
              <EmptyState
                icon={<Search className="size-6" aria-hidden />}
                title={t('emptyTitle')}
                description={t('emptyText')}
                action={
                  <>
                    {activeCount > 0 && (
                      <Button variant="outline" onClick={reset} icon={<RotateCcw className="size-4" aria-hidden />}>
                        {t('reset')}
                      </Button>
                    )}
                    <ButtonLink href="/custom-furniture" icon={<PencilRuler className="size-4" aria-hidden />}>
                      {t('emptyCta')}
                    </ButtonLink>
                  </>
                }
              />
            ) : (
              <ul className={cn('grid gap-x-3 gap-y-10 sm:gap-x-5 lg:gap-x-6 lg:gap-y-12', gridClass)}>
                {result.items.map((product, index) => (
                  <li key={product.id}>
                    <ProductCard
                      product={product}
                      index={index}
                      priority={index < 3}
                      sizes={density === 'compact' ? '(min-width: 1280px) 20vw, (min-width: 768px) 28vw, 48vw' : '(min-width: 1280px) 26vw, (min-width: 420px) 45vw, 92vw'}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pagination */}
          {result && result.pageCount > 1 && (
            <nav aria-label={t('pagination')} className="mt-14 flex flex-col items-center gap-4 border-t border-line pt-8">
              <p className="text-[0.875rem] text-muted">{t('page', { page: result.page, total: result.pageCount })}</p>
              <ul className="flex flex-wrap items-center justify-center gap-1.5">
                <li>
                  {result.page > 1 ? (
                    <Link href={pageHref(result.page - 1)} scroll className="inline-flex size-11 items-center justify-center rounded-md border border-line-strong text-ink hover:border-ink" aria-label={t('goToPage', { page: result.page - 1 })}>
                      <ChevronLeft className="size-4" aria-hidden />
                    </Link>
                  ) : (
                    <span className="inline-flex size-11 items-center justify-center rounded-md border border-line text-line-strong" aria-hidden>
                      <ChevronLeft className="size-4" />
                    </span>
                  )}
                </li>
                {Array.from({ length: result.pageCount }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === result.pageCount || Math.abs(p - result.page) <= 1)
                  .map((p, i, arr) => (
                    <li key={p} className="flex items-center gap-1.5">
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-muted">…</span>}
                      <Link
                        href={pageHref(p)}
                        aria-current={p === result.page ? 'page' : undefined}
                        aria-label={t('goToPage', { page: p })}
                        className={cn(
                          'inline-flex size-11 items-center justify-center rounded-md border text-[0.9375rem] font-semibold',
                          p === result.page ? 'border-espresso bg-espresso text-canvas' : 'border-line-strong text-ink hover:border-ink',
                        )}
                      >
                        {p}
                      </Link>
                    </li>
                  ))}
                <li>
                  {result.page < result.pageCount ? (
                    <Link href={pageHref(result.page + 1)} className="inline-flex size-11 items-center justify-center rounded-md border border-line-strong text-ink hover:border-ink" aria-label={t('goToPage', { page: result.page + 1 })}>
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  ) : (
                    <span className="inline-flex size-11 items-center justify-center rounded-md border border-line text-line-strong" aria-hidden>
                      <ChevronRight className="size-4" />
                    </span>
                  )}
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t('filters')}
        closeLabel={t('showResults')}
        side="bottom"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={reset} disabled={activeCount === 0} className="flex-1">
              {t('reset')}
            </Button>
            <Button variant="dark" onClick={() => setDrawerOpen(false)} className="flex-[1.4]" loading={pending}>
              {result ? `${t('showResults')} (${result.total})` : t('showResults')}
            </Button>
          </div>
        }
      >
        <div className="px-5 py-4">{panel('mobile')}</div>
      </Drawer>
    </div>
  );
}
