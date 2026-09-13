'use client';

import { ChevronLeft, ChevronRight, Expand, ZoomIn, ZoomOut } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type MouseEvent, type TouchEvent } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { SmartImage } from '@/components/ui/smart-image';
import { cn, localized } from '@/lib/utils';
import type { Locale } from '@/types/domain';

interface GalleryImage {
  id: string;
  url: string;
  alt_en: string | null;
  alt_id: string | null;
}

export function ProductGallery({
  images,
  productName,
  priority = false,
  compact = false,
}: {
  images: GalleryImage[];
  productName: string;
  priority?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations('product');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const touchStart = useRef<number | null>(null);

  const imageKey = images.map((i) => i.id).join(',');
  useEffect(() => setIndex(0), [imageKey]);
  useEffect(() => setZoom(null), [index, lightbox]);

  const total = images.length;
  const current = images[Math.min(index, Math.max(0, total - 1))];
  const go = (delta: number) => total > 1 && setIndex((i) => (i + delta + total) % total);
  const altFor = (image: GalleryImage | undefined, i: number) =>
    (image && localized(image, 'alt', locale)) || `${productName} — ${t('imageCounter', { index: i + 1, total })}`;

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onTouchStart = (event: TouchEvent) => {
    touchStart.current = event.touches[0].clientX;
  };
  const onTouchEnd = (event: TouchEvent) => {
    if (touchStart.current == null || zoom) return;
    const delta = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
    touchStart.current = null;
  };

  const toggleZoom = (event: MouseEvent<HTMLDivElement>) => {
    if (zoom) return setZoom(null);
    const rect = event.currentTarget.getBoundingClientRect();
    setZoom({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
  };

  if (!total) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-sand">
        <SmartImage src={null} alt={productName} fallbackLabel={t('noImage')} />
      </div>
    );
  }

  const navButton = 'absolute top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border-line bg-surface/95 text-ink transition-colors hover:bg-surface focus-visible:bg-surface';

  return (
    <div className={cn('flex flex-col gap-3 self-start', !compact && 'lg:flex-row-reverse lg:gap-4')}>
      <div className={cn('relative min-w-0', !compact && 'lg:flex-1')}>
        <div
          className="group relative aspect-[4/5] overflow-hidden rounded-md bg-sand"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          aria-roledescription="carousel"
          aria-label={t('gallery')}
        >
          <button type="button" onClick={() => setLightbox(true)} aria-label={t('openImage', { index: index + 1 })} className="absolute inset-0 cursor-zoom-in">
            <SmartImage
              key={current.id}
              src={current.url}
              alt={altFor(current, index)}
              fill
              priority={priority}
              sizes={compact ? '(min-width: 768px) 40vw, 100vw' : '(min-width: 1024px) 50vw, 100vw'}
              className="animate-fade-in object-cover"
            />
          </button>
          {total > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label={t('previousImage')} className={cn(navButton, 'left-3')}>
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button type="button" onClick={() => go(1)} aria-label={t('nextImage')} className={cn(navButton, 'right-3')}>
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </>
          )}
          <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-sm bg-surface/90 px-2 py-1 text-[0.75rem] font-medium text-ink" aria-live="polite">
            <Expand className="size-3.5" aria-hidden /> {index + 1} / {total}
          </span>
        </div>
      </div>

      {total > 1 && (
        <ul className={cn('scroll-x flex gap-2', !compact && 'lg:w-20 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible')}>
          {images.map((image, i) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t('showImage', { index: i + 1 })}
                aria-current={i === index}
                className={cn(
                  'relative block w-16 rounded-md border p-[3px] transition-[border-color,opacity] lg:w-20',
                  i === index ? 'border-ink' : 'border-transparent opacity-70 hover:border-line hover:opacity-100',
                )}
              >
                <span className="relative block aspect-[4/5] overflow-hidden rounded-sm bg-sand">
                  <SmartImage src={image.url} alt="" fill sizes="80px" className="object-cover" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={lightbox} onClose={() => setLightbox(false)} title={productName} closeLabel={tc('close')} className="sm:max-w-5xl">
        <div className="relative bg-sand">
          <div
            className={cn('relative mx-auto aspect-[4/5] max-h-[calc(88dvh-8rem)] overflow-hidden', zoom ? 'cursor-zoom-out' : 'cursor-zoom-in')}
            onClick={toggleZoom}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <SmartImage
              key={`lb-${current.id}`}
              src={current.url}
              alt={altFor(current, index)}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              quality={85}
              className="object-contain transition-transform duration-300"
              style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          </div>
          {total > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label={t('previousImage')} className={cn(navButton, 'left-3')}>
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button type="button" onClick={() => go(1)} aria-label={t('nextImage')} className={cn(navButton, 'right-3')}>
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 px-5 py-3">
          <p className="text-[0.875rem] text-muted" aria-live="polite">
            {t('imageCounter', { index: index + 1, total })}
          </p>
          <button
            type="button"
            onClick={() => setZoom(zoom ? null : { x: 50, y: 50 })}
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-[0.875rem] font-semibold text-ink hover:bg-sand"
          >
            {zoom ? <ZoomOut className="size-4" aria-hidden /> : <ZoomIn className="size-4" aria-hidden />}
            {zoom ? '1×' : '2×'}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
