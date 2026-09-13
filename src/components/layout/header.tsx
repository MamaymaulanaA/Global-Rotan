import { ArrowRight } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { getCategories } from '@/lib/data/catalog';
import { localized } from '@/lib/utils';
import type { Locale } from '@/types/domain';
import type { AnnouncementSettings } from '@/types/settings';
import { FavoritesLink, InquiryLink } from './header-actions';
import { Logo } from './logo';
import { MainNav } from './main-nav';
import { MobileMenu } from './mobile-menu';
import { CurrencySwitcher, LanguageSwitcher } from './preference-switchers';
import { SearchDialog } from './search-dialog';

export async function AnnouncementBar({ announcement }: { announcement: AnnouncementSettings }) {
  const locale = (await getLocale()) as Locale;
  if (!announcement.enabled) return null;
  const text = localized(announcement, 'text', locale);
  if (!text) return null;
  const content = (
    <>
      <span>{text}</span>
      {announcement.link && <ArrowRight className="size-3.5 shrink-0" aria-hidden />}
    </>
  );
  return (
    <div className="bg-espresso text-canvas">
      <div className="container-page flex min-h-10 items-center justify-center text-center text-[0.8125rem] tracking-[0.02em]">
        {announcement.link?.startsWith('/') ? (
          <Link href={announcement.link} className="inline-flex min-h-11 items-center gap-2 py-2 underline-offset-4 hover:underline">
            {content}
          </Link>
        ) : (
          <p className="inline-flex items-center gap-2 py-2.5">{content}</p>
        )}
      </div>
    </div>
  );
}

export async function Header() {
  const t = await getTranslations('nav');
  const locale = (await getLocale()) as Locale;
  let categories: { slug: string; name: string }[] = [];
  try {
    categories = (await getCategories()).map((c) => ({ slug: c.slug, name: localized(c, 'name', locale) }));
  } catch {
    categories = [];
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas">
      <div className="container-page">
        <div className="flex h-16 items-center gap-1 sm:gap-2 lg:h-[76px] lg:gap-4">
          <div className="lg:hidden">
            <Suspense>
              <MobileMenu />
            </Suspense>
          </div>
          <Link href="/" aria-label={`Global Rotan — ${t('home')}`} className="mr-auto flex min-h-11 items-center rounded-sm">
            <Logo />
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <Suspense>
              <LanguageSwitcher />
            </Suspense>
            <CurrencySwitcher />
          </div>
          <span className="mx-1 hidden h-7 w-px bg-line-strong lg:block" aria-hidden />
          <div className="flex items-center gap-0.5">
            <SearchDialog categories={categories} />
            <FavoritesLink className="max-[389px]:hidden" />
            <InquiryLink />
          </div>
          <ButtonLink href="/request-quote" size="sm" className="ml-2 hidden md:inline-flex">
            {t('requestQuote')}
          </ButtonLink>
        </div>
      </div>
      <div className="hidden border-t border-line lg:block">
        <div className="container-page">
          <MainNav />
        </div>
      </div>
    </header>
  );
}
