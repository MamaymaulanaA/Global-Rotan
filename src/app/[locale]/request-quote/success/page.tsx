import { CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SuccessView } from '@/components/inquiry/success-view';
import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/types/domain';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ number?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('success'), robots: { index: false, follow: false } };
}

export default async function SuccessPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { number } = await searchParams;
  if (!number || !/^GR-\d{4}-\d{5}$/.test(number)) {
    redirect({ href: '/inquiry', locale });
  }
  const t = await getTranslations('success');

  return (
    <section className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-7" strokeWidth={1.6} aria-hidden />
        </span>
        <p className="eyebrow mt-6">{t('eyebrow')}</p>
        <h1 className="text-h1 mt-3">{t('title')}</h1>
        <p className="text-lead mt-4">{t('description')}</p>
      </div>
      <div className="mt-10">
        <SuccessView number={number!} />
      </div>
    </section>
  );
}
