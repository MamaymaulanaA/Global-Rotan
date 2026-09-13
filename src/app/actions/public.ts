'use server';

import { checkRateLimit } from '@/lib/rate-limit';
import { createServiceClient } from '@/lib/supabase/service';
import { siteUrl } from '@/lib/utils';
import {
  contactFormSchema,
  looksLikeSpam,
  quoteSubmissionSchema,
  sanitizeText,
  type ContactFormValues,
  type QuoteSubmission,
} from '@/lib/validation/public-forms';

export type ActionError = 'validation' | 'rate_limit' | 'unavailable' | 'spam' | 'not_configured' | 'server';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError; fieldErrors?: Record<string, string> };

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.filter((p) => typeof p === 'string' || typeof p === 'number').join('.');
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export async function submitQuoteRequest(input: QuoteSubmission): Promise<ActionResult<{ inquiryNumber: string }>> {
  const parsed = quoteSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'validation', fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const { form, items, locale, sourceUrl, startedAt } = parsed.data;

  // Spam protection: honeypot, minimum fill time, link spam
  if (form.website) return { ok: false, error: 'spam' };
  if (startedAt && Date.now() - startedAt < 2500) return { ok: false, error: 'spam' };
  if (looksLikeSpam(form.message, form.customization_request)) return { ok: false, error: 'spam' };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, error: 'not_configured' };

  const limit = await checkRateLimit('inquiry', 5, 600);
  if (!limit.allowed) return { ok: false, error: 'rate_limit' };

  const payload = {
    full_name: sanitizeText(form.full_name),
    company_name: sanitizeText(form.company_name),
    email: form.email.trim().toLowerCase(),
    phone_country_code: form.phone_country_code,
    phone_number: form.phone_number.replace(/[^\d]/g, ''),
    country: sanitizeText(form.country),
    customer_type: form.customer_type,
    shipping_destination: sanitizeText(form.shipping_destination),
    preferred_language: form.preferred_language,
    preferred_currency: form.preferred_currency,
    estimated_budget: sanitizeText(form.estimated_budget),
    required_delivery_date: form.required_delivery_date || '',
    customization_request: sanitizeText(form.customization_request),
    message: sanitizeText(form.message),
    locale,
    source_url: sourceUrl ? sanitizeText(sourceUrl).slice(0, 500) : '',
    ip_hash: limit.ipHash,
    site_url: siteUrl(locale === 'id' ? '/id' : ''),
    items: items.map((item) => ({
      product_id: item.product_id,
      color_id: item.color_id ?? null,
      size_id: item.size_id ?? null,
      finishing: sanitizeText(item.finishing),
      quantity: item.quantity,
      note: sanitizeText(item.note),
    })),
  };

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('submit_inquiry', { payload });
    if (error) {
      if (/product_unavailable|variant_unavailable/.test(error.message)) return { ok: false, error: 'unavailable' };
      console.error('[submitQuoteRequest]', error.message);
      return { ok: false, error: 'server' };
    }
    const result = data as { inquiry_number: string };
    return { ok: true, data: { inquiryNumber: result.inquiry_number } };
  } catch (error) {
    console.error('[submitQuoteRequest]', error instanceof Error ? error.message : error);
    return { ok: false, error: 'server' };
  }
}

export async function submitContactMessage(
  input: ContactFormValues & { locale: 'en' | 'id'; startedAt?: number },
): Promise<ActionResult<{ email: string }>> {
  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'validation', fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  const values = parsed.data;
  if (values.website) return { ok: false, error: 'spam' };
  if (input.startedAt && Date.now() - input.startedAt < 2500) return { ok: false, error: 'spam' };
  if (looksLikeSpam(values.message, values.subject)) return { ok: false, error: 'spam' };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, error: 'not_configured' };

  const limit = await checkRateLimit('contact', 5, 600);
  if (!limit.allowed) return { ok: false, error: 'rate_limit' };

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from('contact_messages').insert({
      topic: values.topic,
      full_name: sanitizeText(values.full_name),
      email: values.email.trim().toLowerCase(),
      phone: sanitizeText(values.phone) || null,
      company_name: sanitizeText(values.company_name) || null,
      country: sanitizeText(values.country) || null,
      subject: sanitizeText(values.subject) || null,
      message: sanitizeText(values.message),
      product_id: values.product_id || null,
      product_url: sanitizeText(values.product_url) || null,
      locale: input.locale === 'id' ? 'id' : 'en',
      ip_hash: limit.ipHash,
    });
    if (error) {
      console.error('[submitContactMessage]', error.message);
      return { ok: false, error: 'server' };
    }
    return { ok: true, data: { email: values.email } };
  } catch (error) {
    console.error('[submitContactMessage]', error instanceof Error ? error.message : error);
    return { ok: false, error: 'server' };
  }
}
