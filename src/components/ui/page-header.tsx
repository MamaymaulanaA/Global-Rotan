import { ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { jsonLd } from '@/lib/seo';
import { cn, localePath, siteUrl } from '@/lib/utils';
import type { Locale } from '@/types/domain';

export interface Crumb {
  label: string;
  href?: string;
}

export async function Breadcrumbs({ items, locale, className }: { items: Crumb[]; locale: Locale; className?: string }) {
  const t = await getTranslations('common');
  const all: Crumb[] = [{ label: t('home'), href: '/' }, ...items];
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: siteUrl(localePath(locale, item.href)) } : {}),
    })),
  };
  return (
    <nav aria-label={t('breadcrumb')} className={cn('text-[0.8125rem]', className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted">
        {all.map((item, index) => {
          const last = index === all.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="-mx-1.5 inline-flex min-h-11 items-center px-1.5 transition-colors hover:text-ink">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={cn('truncate', last && 'text-ink-soft')}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="size-3.5 shrink-0" aria-hidden />}
            </li>
          );
        })}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structured)} />
    </nav>
  );
}

export async function PageHeader({
  locale,
  crumbs,
  eyebrow,
  title,
  description,
  children,
  align = 'left',
  tone = 'plain',
}: {
  locale: Locale;
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'plain' | 'sand';
}) {
  return (
    <section className={cn('border-b border-line', tone === 'sand' && 'bg-sand')}>
      <div className={cn('container-page pb-10 pt-6 lg:pb-14 lg:pt-8', align === 'center' && 'text-center')}>
        <Breadcrumbs items={crumbs} locale={locale} className={cn(align === 'center' && 'flex justify-center')} />
        <div className={cn('mt-8 max-w-3xl lg:mt-10', align === 'center' && 'mx-auto')}>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="text-h1 mt-3">{title}</h1>
          {description && <div className="text-lead mt-4">{description}</div>}
          {children}
        </div>
      </div>
    </section>
  );
}
