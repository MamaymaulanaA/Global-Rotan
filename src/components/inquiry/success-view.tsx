'use client';

import { Check, Copy, MessageCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSite } from '@/components/providers/site-provider';
import { ButtonLink } from '@/components/ui/button';
import { SmartImage } from '@/components/ui/smart-image';
import { fillTemplate, whatsappUrl } from '@/lib/whatsapp';
import type { Locale } from '@/types/domain';
import { LAST_INQUIRY_KEY } from '@/lib/constants';

interface StoredInquiry {
  number: string;
  name: string;
  items: {
    key: string;
    name_en: string;
    name_id: string;
    sku: string;
    image_url: string | null;
    quantity: number;
    color_name_en: string | null;
    color_name_id: string | null;
    size_label_en: string | null;
    size_label_id: string | null;
  }[];
}

export function SuccessView({ number }: { number: string }) {
  const t = useTranslations('success');
  const locale = useLocale() as Locale;
  const { whatsapp, whatsappTemplates } = useSite();
  const [stored, setStored] = useState<StoredInquiry | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_INQUIRY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredInquiry;
        if (parsed.number === number) setStored(parsed);
      }
    } catch {
      // ignore
    }
  }, [number]);

  const itemsText = stored?.items
    .map((i) => {
      const extras = [locale === 'id' ? i.color_name_id : i.color_name_en, locale === 'id' ? i.size_label_id : i.size_label_en].filter(Boolean).join(', ');
      return `${locale === 'id' ? i.name_id : i.name_en} (${i.sku}${extras ? `, ${extras}` : ''}) × ${i.quantity}`;
    })
    .join('; ');

  const message = fillTemplate((locale === 'id' ? whatsappTemplates.inquiry_id : whatsappTemplates.inquiry_en) ?? '', {
    inquiry_number: number,
    name: stored?.name,
    items: itemsText,
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      toast.success(t('numberCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
      <div>
        <div className="rounded-md border border-line bg-surface p-6 sm:p-8">
          <p className="text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-muted">{t('inquiryNumber')}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="font-display text-[2rem] font-semibold tracking-[0.01em] text-ink tabular-nums">{number}</p>
            <button
              type="button"
              onClick={copy}
              aria-label={t('copyNumber')}
              title={t('copyNumber')}
              className="inline-flex size-11 items-center justify-center rounded-md border border-line-strong text-ink hover:border-ink"
            >
              {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            </button>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappUrl(whatsapp, message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-success px-6 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-success/90"
            >
              <MessageCircle className="size-5" aria-hidden />
              {t('whatsappCta')}
            </a>
            <ButtonLink href="/products" variant="outline">
              {t('backToProducts')}
            </ButtonLink>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-h3">{t('nextTitle')}</h2>
          <ol className="mt-5 space-y-4">
            {(['review', 'contact', 'quote'] as const).map((key, index) => (
              <li key={key} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-soft text-[0.875rem] font-semibold text-gold-ink">{index + 1}</span>
                <p className="pt-1">{t(`steps.${key}`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div>
        <h2 className="text-h3">{t('summary')}</h2>
        {stored?.items.length ? (
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {stored.items.map((item) => (
              <li key={item.key} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 py-4">
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-sand">
                  <SmartImage src={item.image_url} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-ink">{locale === 'id' ? item.name_id : item.name_en}</p>
                  <p className="text-[0.8125rem] text-muted">
                    SKU {item.sku}
                    {[locale === 'id' ? item.color_name_id : item.color_name_en, locale === 'id' ? item.size_label_id : item.size_label_en]
                      .filter(Boolean)
                      .map((v) => ` · ${v}`)
                      .join('')}
                  </p>
                </div>
                <p className="font-semibold tabular-nums text-ink">× {item.quantity}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-muted">{t('missing')}</p>
        )}
      </div>
    </div>
  );
}
