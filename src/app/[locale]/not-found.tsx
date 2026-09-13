import { Compass } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/button';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  return (
    <section className="container-narrow flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-sand text-gold-ink">
        <Compass className="size-7" strokeWidth={1.5} aria-hidden />
      </span>
      <p className="eyebrow mt-6">{t('code')}</p>
      <h1 className="mt-3 text-h1">{t('title')}</h1>
      <p className="mt-4 max-w-md text-lead">{t('description')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">{t('home')}</ButtonLink>
        <ButtonLink href="/products" variant="outline">
          {t('products')}
        </ButtonLink>
      </div>
    </section>
  );
}
