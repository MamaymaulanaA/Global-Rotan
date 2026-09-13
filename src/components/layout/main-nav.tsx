'use client';

import { ChevronDown, Globe2, PencilRuler } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export const NAV_ITEMS = [
  { href: '/', key: 'home' },
  { href: '/products', key: 'products' },
  { href: '/collections', key: 'collections' },
  { href: '/about', key: 'about' },
] as const;

export function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MainNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLLIElement>(null);
  const customActive = isActivePath(pathname, '/custom-furniture') || isActivePath(pathname, '/export');

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const linkClass = (active: boolean) =>
    cn(
      'relative inline-flex min-h-12 items-center whitespace-nowrap px-3 text-[0.9375rem] font-medium transition-colors duration-200 xl:px-4',
      'after:absolute after:inset-x-3 after:bottom-0 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-300 xl:after:inset-x-4',
      active ? 'text-ink after:scale-x-100' : 'text-ink-soft hover:text-ink after:scale-x-0 hover:after:scale-x-100',
    );

  return (
    <nav aria-label={t('mainNavigation')}>
      <ul className="-ml-3 flex items-center xl:-ml-4">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? 'page' : undefined} className={linkClass(active)}>
                {t(item.key)}
              </Link>
            </li>
          );
        })}
        <li ref={menuRef} className="relative">
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="true"
            onClick={() => setOpen((v) => !v)}
            className={cn(linkClass(customActive), 'gap-1.5')}
          >
            {t('customExport')}
            <ChevronDown className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
          </button>
          {open && (
            <div className="animate-rise-in absolute left-0 top-full z-50 mt-1 w-[340px] rounded-lg border border-line-strong bg-surface p-2">
              {[
                { href: '/custom-furniture', title: t('customFurniture'), desc: t('customFurnitureDesc'), Icon: PencilRuler },
                { href: '/export', title: t('exportInfo'), desc: t('exportInfoDesc'), Icon: Globe2 },
              ].map(({ href, title, desc, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActivePath(pathname, href) ? 'page' : undefined}
                  className="flex gap-3 rounded-md border border-transparent p-3 transition-colors hover:bg-hover-soft focus-visible:bg-hover-soft"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gold-soft text-gold-ink">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold text-ink">{title}</span>
                    <span className="block text-[0.8125rem] leading-snug text-muted">{desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </li>
        <li>
          <Link href="/contact" aria-current={isActivePath(pathname, '/contact') ? 'page' : undefined} className={linkClass(isActivePath(pathname, '/contact'))}>
            {t('contact')}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
