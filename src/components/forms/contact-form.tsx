'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Send } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { submitContactMessage } from '@/app/actions/public';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import type { CountryOption } from '@/lib/countries';
import { contactFormSchema, type ContactFormValues } from '@/lib/validation/public-forms';
import { MESSAGE_TOPICS, type Locale, type MessageTopic } from '@/types/domain';

export function ContactForm({
  defaultTopic = 'general',
  product,
  countries,
}: {
  defaultTopic?: MessageTopic;
  product?: { id: string; name: string; url: string } | null;
  /** Localized on the server so option labels are identical during hydration. */
  countries: CountryOption[];
}) {
  const t = useTranslations('contact');
  const tq = useTranslations('quote');
  const tv = useTranslations('validation');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const startedAt = useRef(Date.now());
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const defaults: ContactFormValues = {
    topic: defaultTopic,
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    country: '',
    subject: product ? t('aboutProduct', { name: product.name }) : '',
    message: '',
    product_id: product?.id ?? '',
    product_url: product?.url ?? '',
    website: '',
  };

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactFormSchema), mode: 'onTouched', defaultValues: defaults });

  const err = (key?: string) => (key ? tv(key as 'required') : undefined);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await submitContactMessage({ ...values, locale, startedAt: startedAt.current });
    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [key, message] of Object.entries(result.fieldErrors)) setError(key as keyof ContactFormValues, { message });
      }
      setServerError(
        result.error === 'rate_limit'
          ? tq('errorRateLimit')
          : result.error === 'not_configured'
            ? tq('notConfigured')
            : result.error === 'validation'
              ? tq('errorValidation')
              : t('errorGeneric'),
      );
      return;
    }
    setSentTo(result.data.email);
    reset(defaults);
    startedAt.current = Date.now();
  });

  if (sentTo) {
    return (
      <div className="rounded-md border border-success/30 bg-success-soft p-6 sm:p-8" role="status">
        <CheckCircle2 className="size-8 text-success" strokeWidth={1.6} aria-hidden />
        <h2 className="text-h3 mt-4">{t('successTitle')}</h2>
        <p className="mt-2">{t('successText', { email: sentTo })}</p>
        <Button variant="outline" className="mt-6" onClick={() => setSentTo(null)}>
          {t('sendAnother')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-md border border-line bg-surface p-5 sm:p-8">
      <h2 className="text-h3">{t('formTitle')}</h2>
      {serverError && (
        <p role="alert" className="mt-4 rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-[0.9375rem] text-danger">
          {serverError}
        </p>
      )}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label={t('topic')} required className="sm:col-span-2">
          {({ id }) => (
            <Select id={id} {...register('topic')}>
              {MESSAGE_TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {t(`topics.${topic}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('fullName')} required error={err(errors.full_name?.message)}>
          {({ id, describedBy, invalid }) => <Input id={id} autoComplete="name" aria-describedby={describedBy} invalid={invalid} {...register('full_name')} />}
        </Field>
        <Field label={t('email')} required error={err(errors.email?.message)}>
          {({ id, describedBy, invalid }) => <Input id={id} type="email" inputMode="email" autoComplete="email" aria-describedby={describedBy} invalid={invalid} {...register('email')} />}
        </Field>
        <Field label={t('phone')} optionalLabel={tc('optional')} error={err(errors.phone?.message)}>
          {({ id, describedBy, invalid }) => <Input id={id} type="tel" inputMode="tel" autoComplete="tel" aria-describedby={describedBy} invalid={invalid} {...register('phone')} />}
        </Field>
        <Field label={t('company')} optionalLabel={tc('optional')} error={err(errors.company_name?.message)}>
          {({ id, describedBy, invalid }) => <Input id={id} autoComplete="organization" aria-describedby={describedBy} invalid={invalid} {...register('company_name')} />}
        </Field>
        <Field label={t('country')} optionalLabel={tc('optional')}>
          {({ id }) => (
            <Select id={id} autoComplete="country-name" {...register('country')}>
              <option value="">{tq('select')}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('subject')} optionalLabel={tc('optional')} error={err(errors.subject?.message)}>
          {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} {...register('subject')} />}
        </Field>
        <Field label={t('message')} required error={err(errors.message?.message)} className="sm:col-span-2">
          {({ id, describedBy, invalid }) => (
            <Textarea id={id} rows={6} maxLength={4000} placeholder={t('messagePlaceholder')} aria-describedby={describedBy} invalid={invalid} {...register('message')} />
          )}
        </Field>
      </div>
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor="contact-website">{tq('honeypot')}</label>
        <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>
      <input type="hidden" {...register('product_id')} />
      <input type="hidden" {...register('product_url')} />
      <Button type="submit" size="lg" className="mt-7 w-full sm:w-auto" loading={isSubmitting} icon={<Send className="size-5" aria-hidden />}>
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
