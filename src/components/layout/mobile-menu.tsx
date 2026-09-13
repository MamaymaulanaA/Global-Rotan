'use client';

import { ClipboardList, Heart, Mail, Menu, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useSite } from '@/components/providers/site-provider';
import { ButtonLink } from '@/components/ui/button';
import { Drawer } from '@/components/ui/dialog';
import { IconButton } from '@/components/ui/icon-button';
import { useHydrated } from '@/hooks/use-hydrated';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { whatsappUrl } from '@/lib/whatsapp';
import { useFavorites } from '@/stores/favorites';
import { useInquiry } from '@/stores/inquiry';
import { NAV_ITEMS, isActivePath } from './main-nav';
import { CurrencySwitcher, LanguageSwitcher } from './preference-switchers';

export function MobileMenu() {
  const t = useTranslations('nav');
  const th = useTranslations('header');
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const hydrated = useHydrated();
  const favorites = useFavorites((s) => s.ids.length);
  const items = useInquiry((s) => s.items.length);
  const { whatsapp, email, locale, whatsappTemplates } = useSite();

  useEffect(() => setOpen(false), [pathname]);

  const link = (href: string, label: string, sub = false) => {
    const active = isActivePath(pathname, href);
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-12 items-center border px-5 transition-colors',
          sub ? 'pl-9 text-[0.9375rem]' : 'text-base font-medium',
          active
            ? 'border-transparent border-l-gold bg-selected-soft font-semibold text-ink'
            : 'border-transparent text-ink-soft hover:bg-hover-soft hover:text-ink',
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <IconButton label={th('openMenu')} onClick={() => setOpen(true)} className="-ml-2">
        <Menu className="size-6" strokeWidth={1.75} aria-hidden />
      </IconButton>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t('mainNavigation')}
        closeLabel={th('closeMenu')}
        side="left"
        footer={
          <ButtonLink href="/request-quote" variant="primary" className="w-full">
            {t('requestQuote')}
          </ButtonLink>
        }
      >
        <nav aria-label={t('mainNavigation')} className="py-3">
          {NAV_ITEMS.map((item) => (
            <div key={item.href}>{link(item.href, t(item.key))}</div>
          ))}
          <p className="px-5 pb-1 pt-4 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-muted">{t('customExport')}</p>
          {link('/custom-furniture', t('customFurniture'), true)}
          {link('/export', t('exportInfo'), true)}
          <div className="mt-2">{link('/contact', t('contact'))}</div>
        </nav>

        <div className="mx-5 grid grid-cols-1 gap-2 border-t border-line pt-5">
          <Link href="/favorites" className="flex min-h-12 items-center gap-2.5 rounded-md border border-field-border px-3 text-[0.9375rem] text-ink transition-colors hover:border-field-border-hover hover:bg-hover-soft">
            <Heart className="size-5" strokeWidth={1.75} aria-hidden />
            <span>{t('favorites')}</span>
            {hydrated && favorites > 0 && <span className="ml-auto text-[0.8125rem] font-semibold text-gold-ink">{favorites}</span>}
          </Link>
          <Link href="/inquiry" className="flex min-h-12 items-center gap-2.5 rounded-md border border-field-border px-3 text-[0.9375rem] text-ink transition-colors hover:border-field-border-hover hover:bg-hover-soft">
            <ClipboardList className="size-5" strokeWidth={1.75} aria-hidden />
            <span>{t('inquiryCart')}</span>
            {hydrated && items > 0 && <span className="ml-auto text-[0.8125rem] font-semibold text-gold-ink">{items}</span>}
          </Link>
        </div>

        <div className="mx-5 mt-6 space-y-4 border-t border-line pt-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.875rem] font-medium text-ink">{th('language')}</span>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.875rem] font-medium text-ink">{th('currency')}</span>
            <CurrencySwitcher />
          </div>
        </div>

        <div className="mx-5 mb-6 mt-6 space-y-1 border-t border-line pt-4 text-[0.9375rem]">
          <a
            href={whatsappUrl(whatsapp, locale === 'id' ? whatsappTemplates.general_id : whatsappTemplates.general_en)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-3 text-ink-soft hover:text-ink"
          >
            <MessageCircle className="size-5 text-gold-ink" strokeWidth={1.75} aria-hidden /> WhatsApp
          </a>
          <a href={`mailto:${email}`} className="flex min-h-11 items-center gap-3 break-all text-ink-soft hover:text-ink">
            <Mail className="size-5 shrink-0 text-gold-ink" strokeWidth={1.75} aria-hidden /> {email}
          </a>
        </div>
      </Drawer>
    </>
  );
}
