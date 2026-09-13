'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('errors');
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="container-narrow flex min-h-[60vh] flex-col items-center justify-center py-20 text-center" role="alert">
      <span className="flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="size-7" strokeWidth={1.5} aria-hidden />
      </span>
      <h1 className="mt-6 text-h1">{t('title')}</h1>
      <p className="mt-4 max-w-md text-lead">{t('description')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset} icon={<RotateCcw className="size-4" aria-hidden />}>
          {t('retry')}
        </Button>
        <ButtonLink href="/" variant="outline">
          {t('home')}
        </ButtonLink>
      </div>
    </section>
  );
}
