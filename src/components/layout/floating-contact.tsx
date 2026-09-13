'use client';

import { ClipboardList, MessageCircle, MessageSquareText, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useSite } from '@/components/providers/site-provider';
import { useEscape } from '@/hooks/use-overlay';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { whatsappUrl } from '@/lib/whatsapp';
import { useContactContext } from '@/stores/contact-context';

export function FloatingContact() {
  const t = useTranslations('floating');
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { whatsapp, locale, whatsappTemplates } = useSite();
  const productMessage = useContactContext((s) => s.productMessage);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEscape(open, () => {
    setOpen(false);
    buttonRef.current?.focus();
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (pathname === '/request-quote' || pathname.startsWith('/request-quote/')) return null;

  const general = (locale === 'id' ? whatsappTemplates.general_id : whatsappTemplates.general_en) ?? '';
  const options = [
    {
      key: 'whatsapp',
      href: whatsappUrl(whatsapp, productMessage ?? general),
      external: true,
      title: t('whatsapp'),
      desc: t('whatsappDesc'),
      Icon: MessageCircle,
    },
    { key: 'inquiry', href: '/inquiry', title: t('inquiry'), desc: t('inquiryDesc'), Icon: ClipboardList },
    { key: 'question', href: '/contact', title: t('question'), desc: t('questionDesc'), Icon: MessageSquareText },
  ];

  return (
    <div className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-3 sm:right-6">
      {open && (
        <div
          ref={panelRef}
          id="floating-contact-panel"
          role="menu"
          aria-label={t('title')}
          className="animate-rise-in pointer-events-auto w-[min(320px,calc(100vw-2rem))] rounded-lg border border-line-strong bg-surface p-2"
        >
          <p className="px-3 pb-1 pt-2 font-display text-lg text-ink">{t('title')}</p>
          {options.map(({ key, href, external, title, desc, Icon }) => {
            const inner = (
              <>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gold-soft text-gold-ink">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">{title}</span>
                  <span className="block text-[0.8125rem] leading-snug text-muted">{desc}</span>
                </span>
              </>
            );
            const className = 'flex items-center gap-3 rounded-md border border-transparent p-3 transition-colors hover:bg-hover-soft focus-visible:bg-hover-soft';
            return external ? (
              <a key={key} role="menuitem" href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={() => setOpen(false)}>
                {inner}
              </a>
            ) : (
              <Link key={key} role="menuitem" href={href} className={className}>
                {inner}
              </Link>
            );
          })}
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="floating-contact-panel"
        aria-label={open ? t('close') : t('open')}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'pointer-events-auto inline-flex size-14 items-center justify-center rounded-full border transition-colors duration-200',
          open ? 'border-espresso bg-espresso text-canvas [--color-focus:var(--color-gold)]' : 'border-gold-hover bg-gold text-ink hover:bg-gold-hover [--color-focus:var(--color-ink)]',
        )}
      >
        {open ? <X className="size-6" aria-hidden /> : <MessageCircle className="size-6" strokeWidth={1.9} aria-hidden />}
      </button>
    </div>
  );
}
