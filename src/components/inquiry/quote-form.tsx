'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList, Info, Loader2, Lock, Pencil, Send } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { submitQuoteRequest } from '@/app/actions/public';
import { useSite } from '@/components/providers/site-provider';
import { Button, ButtonLink } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { EmptyState, Notice } from '@/components/ui/misc';
import { QuantityInput } from '@/components/ui/quantity-input';
import { SmartImage } from '@/components/ui/smart-image';
import { useHydrated } from '@/hooks/use-hydrated';
import { Link, useRouter } from '@/i18n/navigation';
import { LAST_INQUIRY_KEY } from '@/lib/constants';
import { countryOptions, dialCodeOptions } from '@/lib/countries';
import { quoteFormSchema, type QuoteFormValues } from '@/lib/validation/public-forms';
import { useInquiry } from '@/stores/inquiry';
import { CUSTOMER_TYPES, type Locale } from '@/types/domain';
import { InquiryItemMeta, useInquirySummary } from './inquiry-cart-view';


function Section({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-md border border-line bg-surface p-5 sm:p-7">
      <legend className="sr-only">{title}</legend>
      <div className="mb-6 flex items-center gap-3" aria-hidden>
        <span className="flex size-8 items-center justify-center rounded-full bg-espresso text-[0.8125rem] font-semibold text-canvas">{number}</span>
        <span className="font-display text-xl text-ink">{title}</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function QuoteForm() {
  const t = useTranslations('quote');
  const tv = useTranslations('validation');
  const tct = useTranslations('customerTypes');
  const ti = useTranslations('inquiry');
  const tp = useTranslations('product');
  const tc = useTranslations('common');
  const th = useTranslations('home.project');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const hydrated = useHydrated();
  const { currency, formatAmount } = useSite();
  const [done, setDone] = useState(false);
  const items = useInquiry((s) => s.items);
  const update = useInquiry((s) => s.update);
  const clear = useInquiry((s) => s.clear);
  const { subtotal, pricedCount, unpricedCount } = useInquirySummary(items);
  const [serverError, setServerError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const errorRef = useRef<HTMLDivElement>(null);

  const countries = useMemo(() => countryOptions(locale), [locale]);
  const dialCodes = useMemo(() => dialCodeOptions(), []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getFieldState,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    mode: 'onTouched',
    defaultValues: {
      full_name: '',
      company_name: '',
      email: '',
      phone_country_code: locale === 'id' ? '+62' : '',
      phone_number: '',
      country: '',
      customer_type: undefined,
      shipping_destination: '',
      preferred_language: locale,
      preferred_currency: currency,
      estimated_budget: '',
      required_delivery_date: '',
      customization_request: '',
      message: '',
      privacy_accepted: false,
      website: '',
    },
  });

  const country = watch('country');
  useEffect(() => {
    const match = countries.find((c) => c.name === country);
    if (match && !getFieldState('phone_country_code').isDirty) {
      setValue('phone_country_code', `+${match.dial}`, { shouldValidate: false });
    }
  }, [country, countries, getFieldState, setValue]);

  const err = (key?: string) => (key ? tv(key as 'required') : undefined);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await submitQuoteRequest({
      form: values,
      items: items.map((i) => ({
        product_id: i.product_id,
        color_id: i.color_id,
        size_id: i.size_id,
        finishing: i.finishing,
        quantity: i.quantity,
        note: i.note,
      })),
      locale,
      sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      startedAt: startedAt.current,
    });

    if (!result.ok) {
      if (result.error === 'validation' && result.fieldErrors) {
        for (const [key, message] of Object.entries(result.fieldErrors)) {
          if (key.startsWith('form.')) setError(key.slice(5) as keyof QuoteFormValues, { message });
        }
      }
      const messages: Record<string, string> = {
        validation: t('errorValidation'),
        rate_limit: t('errorRateLimit'),
        unavailable: t('errorUnavailable'),
        not_configured: t('notConfigured'),
        spam: tv('spam'),
        server: t('errorGeneric'),
      };
      setServerError(messages[result.error] ?? t('errorGeneric'));
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    try {
      sessionStorage.setItem(
        LAST_INQUIRY_KEY,
        JSON.stringify({
          number: result.data.inquiryNumber,
          name: values.full_name,
          items: items.map((i) => ({
            key: i.key,
            name_en: i.name_en,
            name_id: i.name_id,
            sku: i.variant_sku ?? i.sku,
            image_url: i.image_url,
            quantity: i.quantity,
            color_name_en: i.color_name_en,
            color_name_id: i.color_name_id,
            size_label_en: i.size_label_en,
            size_label_id: i.size_label_id,
          })),
        }),
      );
    } catch {
      // ignore storage errors
    }
    setDone(true);
    clear();
    router.push(`/request-quote/success?number=${encodeURIComponent(result.data.inquiryNumber)}`);
  });

  if (!hydrated || done) {
    return (
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_380px]" role="status" aria-label={tc('loading')}>
        <div className="skeleton h-[480px] w-full" />
        <div className="skeleton h-72 w-full" />
      </div>
    );
  }

  if (!items.length && !isSubmitting) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={<ClipboardList className="size-6" aria-hidden />}
          title={ti('emptyTitle')}
          description={t('productsEmpty')}
          action={
            <>
              <ButtonLink href="/products">{ti('browse')}</ButtonLink>
              <ButtonLink href="/contact?topic=project" variant="outline">
                {th('primaryCta')}
              </ButtonLink>
            </>
          }
        />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 lg:py-14">
      <div className="space-y-6">
        {serverError && (
          <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-4 py-3 text-[0.9375rem] text-danger focus:outline-none">
            {serverError}
          </div>
        )}

        <Section number={1} title={t('sections.contact')}>
          <Field label={t('fullName')} required error={err(errors.full_name?.message)}>
            {({ id, describedBy, invalid }) => <Input id={id} autoComplete="name" aria-describedby={describedBy} invalid={invalid} {...register('full_name')} />}
          </Field>
          <Field label={t('companyName')} optionalLabel={tc('optional')} error={err(errors.company_name?.message)}>
            {({ id, describedBy, invalid }) => <Input id={id} autoComplete="organization" aria-describedby={describedBy} invalid={invalid} {...register('company_name')} />}
          </Field>
          <Field label={t('email')} required error={err(errors.email?.message)}>
            {({ id, describedBy, invalid }) => <Input id={id} type="email" autoComplete="email" inputMode="email" aria-describedby={describedBy} invalid={invalid} {...register('email')} />}
          </Field>
          <Field label={t('country')} required error={err(errors.country?.message)}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} autoComplete="country-name" aria-describedby={describedBy} invalid={invalid} {...register('country')}>
                <option value="">{t('select')}</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 sm:col-span-2 sm:grid-cols-[140px_minmax(0,1fr)]">
            <Field label={t('countryCode')} required error={err(errors.phone_country_code?.message)}>
              {({ id, describedBy, invalid }) => (
                <Select id={id} autoComplete="tel-country-code" aria-describedby={describedBy} invalid={invalid} {...register('phone_country_code')}>
                  <option value="">+</option>
                  {dialCodes.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('phone')} required hint={t('phoneHint')} error={err(errors.phone_number?.message)}>
              {({ id, describedBy, invalid }) => (
                <Input id={id} type="tel" inputMode="tel" autoComplete="tel-national" aria-describedby={describedBy} invalid={invalid} {...register('phone_number')} />
              )}
            </Field>
          </div>
        </Section>

        <Section number={2} title={t('sections.business')}>
          <Field label={t('customerType')} required error={err(errors.customer_type?.message)}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} aria-describedby={describedBy} invalid={invalid} {...register('customer_type')} defaultValue="">
                <option value="" disabled>
                  {t('select')}
                </option>
                {CUSTOMER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {tct(type)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t('shippingDestination')} required hint={t('shippingDestinationHint')} error={err(errors.shipping_destination?.message)}>
            {({ id, describedBy, invalid }) => <Input id={id} autoComplete="shipping address-level2" aria-describedby={describedBy} invalid={invalid} {...register('shipping_destination')} />}
          </Field>
        </Section>

        <Section number={3} title={t('sections.preferences')}>
          <Field label={t('preferredLanguage')} required>
            {({ id }) => (
              <Select id={id} {...register('preferred_language')}>
                <option value="en">{t('languages.en')}</option>
                <option value="id">{t('languages.id')}</option>
              </Select>
            )}
          </Field>
          <Field label={t('preferredCurrency')} required>
            {({ id }) => (
              <Select id={id} {...register('preferred_currency')}>
                <option value="USD">USD ($)</option>
                <option value="IDR">IDR (Rp)</option>
              </Select>
            )}
          </Field>
          <Field label={t('estimatedBudget')} optionalLabel={tc('optional')} hint={t('estimatedBudgetHint')} error={err(errors.estimated_budget?.message)}>
            {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} {...register('estimated_budget')} />}
          </Field>
          <Field label={t('deliveryDate')} optionalLabel={tc('optional')} error={err(errors.required_delivery_date?.message)}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} type="date" min={new Date().toISOString().slice(0, 10)} aria-describedby={describedBy} invalid={invalid} {...register('required_delivery_date')} />
            )}
          </Field>
        </Section>

        <fieldset className="rounded-md border border-line bg-surface p-5 sm:p-7">
          <legend className="sr-only">{t('sections.products')}</legend>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3" aria-hidden>
              <span className="flex size-8 items-center justify-center rounded-full bg-espresso text-[0.8125rem] font-semibold text-canvas">4</span>
              <span className="font-display text-xl text-ink">{t('sections.products')}</span>
            </div>
            <Link href="/inquiry" className="inline-flex min-h-11 items-center gap-1.5 text-[0.875rem] font-semibold text-gold-ink hover:underline">
              <Pencil className="size-4" aria-hidden /> {t('editList')}
            </Link>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {items.map((item) => {
              const name = locale === 'id' ? item.name_id : item.name_en;
              return (
                <li key={item.key} className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 py-4">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-sand">
                    <SmartImage src={item.image_url} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{name}</p>
                      <p className="text-[0.8125rem] text-muted">SKU {item.variant_sku ?? item.sku}</p>
                      <InquiryItemMeta item={item} locale={locale} />
                    </div>
                    <QuantityInput
                      size="sm"
                      value={item.quantity}
                      onChange={(quantity) => update(item.key, { quantity })}
                      labelDecrease={tp('decrease')}
                      labelIncrease={tp('increase')}
                      ariaLabel={`${tp('quantity')}: ${name}`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <fieldset className="rounded-md border border-line bg-surface p-5 sm:p-7">
          <legend className="sr-only">{t('sections.message')}</legend>
          <div className="mb-6 flex items-center gap-3" aria-hidden>
            <span className="flex size-8 items-center justify-center rounded-full bg-espresso text-[0.8125rem] font-semibold text-canvas">5</span>
            <span className="font-display text-xl text-ink">{t('sections.message')}</span>
          </div>
          <div className="grid gap-5">
            <Field label={t('customization')} optionalLabel={tc('optional')} error={err(errors.customization_request?.message)}>
              {({ id, describedBy, invalid }) => (
                <Textarea id={id} rows={4} maxLength={3000} placeholder={t('customizationPlaceholder')} aria-describedby={describedBy} invalid={invalid} {...register('customization_request')} />
              )}
            </Field>
            <Field label={t('message')} optionalLabel={tc('optional')} error={err(errors.message?.message)}>
              {({ id, describedBy, invalid }) => (
                <Textarea id={id} rows={4} maxLength={3000} placeholder={t('messagePlaceholder')} aria-describedby={describedBy} invalid={invalid} {...register('message')} />
              )}
            </Field>

            <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
              <label htmlFor="quote-website">{t('honeypot')}</label>
              <input id="quote-website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
            </div>

            <Controller
              control={control}
              name="privacy_accepted"
              render={({ field }) => (
                <div>
                  <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] text-ink-soft">
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      onBlur={field.onBlur}
                      aria-invalid={Boolean(errors.privacy_accepted) || undefined}
                      aria-describedby={errors.privacy_accepted ? 'privacy-error' : undefined}
                    />
                    <span>
                      {t.rich('privacy', {
                        link: (chunks) => (
                          <Link href="/privacy-policy" target="_blank" className="font-semibold text-ink underline decoration-gold underline-offset-2">
                            {chunks}
                          </Link>
                        ),
                      })}
                    </span>
                  </label>
                  {errors.privacy_accepted && (
                    <p id="privacy-error" role="alert" className="mt-1.5 pl-8 text-[0.8125rem] font-medium text-danger">
                      {err(errors.privacy_accepted.message)}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-[140px] lg:self-start">
        <div className="rounded-md border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-h3">{ti('summaryTitle')}</h2>
          <dl className="mt-5 space-y-3 text-[0.9375rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{ti('itemsCount', { count: items.length })}</dt>
              <dd className="tabular-nums">{items.reduce((s, i) => s + i.quantity, 0)} pcs</dd>
            </div>
            {pricedCount > 0 && (
              <div className="flex justify-between gap-4 border-t border-line pt-3">
                <dt className="text-ink">{ti('estimatedSubtotal')}</dt>
                <dd className="font-semibold tabular-nums">≈ {formatAmount(subtotal)}</dd>
              </div>
            )}
            {unpricedCount > 0 && <p className="text-[0.8125rem] text-gold-ink">+ {ti('unpricedItems', { count: unpricedCount })}</p>}
          </dl>
          <Notice tone="gold" icon={<Info className="size-4" aria-hidden />} className="mt-5">
            {ti('disclaimer')}
          </Notice>
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting} icon={isSubmitting ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-5" aria-hidden />}>
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
          <p className="mt-3 flex items-start gap-2 text-[0.8125rem] text-muted">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {t('noPayment')}
          </p>
        </div>
      </aside>
    </form>
  );
}
