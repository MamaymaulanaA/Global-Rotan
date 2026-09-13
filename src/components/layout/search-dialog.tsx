'use client';

import { ArrowRight, Loader2, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { SearchInput } from '@/components/ui/form';
import { IconButton } from '@/components/ui/icon-button';
import { SmartImage } from '@/components/ui/smart-image';
import { Link, useRouter } from '@/i18n/navigation';
import { localized } from '@/lib/utils';
import type { Locale } from '@/types/domain';

interface Suggestion {
  id: string;
  slug: string;
  sku: string;
  name_en: string;
  name_id: string;
  image: string | null;
}

export function SearchDialog({ categories }: { categories: { slug: string; name: string }[] }) {
  const t = useTranslations('search');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (res.ok) setResults((await res.json()).items ?? []);
      } catch {
        // aborted or offline
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const close = () => setOpen(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    close();
    router.push(term ? `/products?q=${encodeURIComponent(term)}` : '/products');
  };

  return (
    <>
      <IconButton label={t('title')} onClick={() => setOpen(true)}>
        <Search className="size-[22px]" strokeWidth={1.75} aria-hidden />
      </IconButton>
      <Dialog open={open} onClose={close} title={t('title')} closeLabel={tc('close')} initialFocus={inputRef} className="sm:max-w-2xl">
        <div className="px-5 pb-6 pt-4 sm:px-6">
          <form onSubmit={submit} role="search" className="flex flex-col gap-2 xs:flex-row">
            <SearchInput
              ref={inputRef}
              id={inputId}
              label={t('placeholder')}
              clearLabel={tc('clear')}
              value={query}
              onValueChange={setQuery}
              placeholder={t('placeholder')}
              className="flex-1"
              trailing={
                loading ? (
                  <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" aria-hidden />
                ) : undefined
              }
            />
            <Button type="submit" className="px-5">
              {t('submit')}
            </Button>
          </form>
          <p className="mt-2 text-[0.8125rem] text-muted">{t('hint')}</p>

          <div aria-live="polite">
            {results.length > 0 && (
              <ul className="mt-5 divide-y divide-line border-y border-line">
                {results.map((item) => (
                  <li key={item.id}>
                    <Link href={`/products/${item.slug}`} onClick={close} className="-mx-2 flex min-h-16 items-center gap-4 rounded-md px-2 py-2.5 transition-colors hover:bg-hover-soft focus-visible:bg-hover-soft">
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-sand">
                        <SmartImage src={item.image} alt="" fill sizes="56px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-ink">{localized(item, 'name', locale)}</span>
                        <span className="block text-[0.8125rem] text-muted">SKU {item.sku}</span>
                      </span>
                      <ArrowRight className="size-4 text-muted" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6">
            <p className="eyebrow mb-3">{t('popular')}</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/products?category=${c.slug}`}
                  onClick={close}
                  className="inline-flex min-h-control-sm items-center rounded-full border border-field-border px-4 text-[0.875rem] text-ink-soft transition-colors hover:border-field-border-hover hover:text-ink"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
