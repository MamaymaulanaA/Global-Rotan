import { z } from 'zod';
import { CUSTOMER_TYPES, MESSAGE_TOPICS } from '@/types/domain';

// Error messages are translation keys under the `validation` namespace.
const text = (max: number) => z.string().trim().max(max, 'tooLong');
const optionalText = (max: number) => text(max).optional().or(z.literal(''));

const todayIso = () => new Date().toISOString().slice(0, 10);

export const quoteFormSchema = z.object({
  full_name: z.string().trim().min(2, 'nameMin').max(120, 'tooLong'),
  company_name: optionalText(160),
  email: z.string().trim().max(200, 'tooLong').email('emailInvalid'),
  phone_country_code: z.string().trim().regex(/^\+\d{1,4}$/, 'codeInvalid'),
  phone_number: z
    .string()
    .trim()
    .refine((v) => {
      const digits = v.replace(/\D/g, '');
      return /^[\d\s().-]+$/.test(v) && digits.length >= 6 && digits.length <= 15;
    }, 'phoneInvalid'),
  country: z.string().trim().min(2, 'countryRequired').max(80, 'tooLong'),
  customer_type: z.enum(CUSTOMER_TYPES, 'customerTypeRequired'),
  shipping_destination: z.string().trim().min(2, 'destinationRequired').max(200, 'tooLong'),
  preferred_language: z.enum(['en', 'id']),
  preferred_currency: z.enum(['USD', 'IDR']),
  estimated_budget: optionalText(120),
  required_delivery_date: z
    .string()
    .optional()
    .refine((v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && v >= todayIso()), 'dateInvalid'),
  customization_request: optionalText(3000),
  message: optionalText(3000),
  privacy_accepted: z.boolean().refine((v) => v === true, 'privacyRequired'),
  website: z.string().max(0, 'spam').optional().or(z.literal('')),
});
export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export const inquiryItemSchema = z.object({
  product_id: z.string().uuid(),
  color_id: z.string().uuid().nullable().optional(),
  size_id: z.string().uuid().nullable().optional(),
  finishing: z.string().trim().max(120).optional().default(''),
  quantity: z.number().int().min(1, 'quantityMin').max(100000),
  note: z.string().trim().max(1000).optional().default(''),
});

export const quoteSubmissionSchema = z.object({
  form: quoteFormSchema,
  items: z.array(inquiryItemSchema).min(1, 'itemsRequired').max(50),
  locale: z.enum(['en', 'id']),
  sourceUrl: z.string().max(500).optional(),
  startedAt: z.number().int().optional(),
});
export type QuoteSubmission = z.infer<typeof quoteSubmissionSchema>;

export const contactFormSchema = z.object({
  topic: z.enum(MESSAGE_TOPICS),
  full_name: z.string().trim().min(2, 'nameMin').max(120, 'tooLong'),
  email: z.string().trim().max(200, 'tooLong').email('emailInvalid'),
  phone: optionalText(40),
  company_name: optionalText(160),
  country: optionalText(80),
  subject: optionalText(160),
  message: z.string().trim().min(10, 'messageMin').max(4000, 'tooLong'),
  product_id: z.string().uuid().optional().or(z.literal('')),
  product_url: optionalText(500),
  website: z.string().max(0, 'spam').optional().or(z.literal('')),
});
export type ContactFormValues = z.infer<typeof contactFormSchema>;

/** Strip HTML tags and control characters from free text before storing. */
export function sanitizeText(value: string | undefined | null) {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, '')
    .split('')
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127);
    })
    .join('')
    .trim();
}

export function looksLikeSpam(...values: (string | undefined)[]) {
  const joined = values.filter(Boolean).join(' ');
  const links = joined.match(/https?:\/\//gi)?.length ?? 0;
  return links > 3 || /\b(viagra|casino|crypto\s*airdrop|seo\s*services)\b/i.test(joined);
}
