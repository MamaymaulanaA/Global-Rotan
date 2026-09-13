# Global Rotan — Rattan Furniture Catalog & Inquiry Platform

Bilingual (EN/ID) catalog website for Indonesian rattan furniture with favorites, an inquiry cart,
quotation requests, WhatsApp integration and a secure admin dashboard.
**No online payments** — orders are confirmed after a quotation.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, RLS) ·
next-intl · React Hook Form + Zod · Zustand (localStorage) · Lucide icons · Vercel.

---

## 1. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to find it | Exposed to browser? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys (anon / publishable) | yes (protected by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys (service_role / secret) | **never** |
| `NEXT_PUBLIC_SITE_URL` | Your production URL, e.g. `https://www.globalrotan.com` | yes |
| `RATE_LIMIT_SALT` | Any long random string | no |
| `DATABASE_URL` | Supabase → Connect → **Session pooler** URI (IPv4). Local scripts only. | no |

> The direct `db.<ref>.supabase.co` host is IPv6-only. Use the session pooler URL
> (`aws-0-<region>.pooler.supabase.com:5432`, user `postgres.<ref>`) and URL-encode special characters
> in the password (`@` → `%40`).

## 2. Database

```bash
npm install
npm run db:migrate      # tables, functions, RLS policies, storage bucket
npm run db:seed         # demo categories, collections, 18 products, testimonials, inquiries
```

Migrations live in `supabase/migrations` and are tracked in `private.schema_migrations`
(re-running is safe). `npm run db:seed -- --reset-settings` overwrites site settings with demo values.

### Tables
`profiles, categories, collections, products, product_images, product_colors, product_sizes,
product_variants, favorites, inquiries, inquiry_items, inquiry_notes, inquiry_counters,
contact_messages, testimonials, site_settings, activity_logs, rate_limits`

### Security model
- **RLS on every table.** Anonymous visitors can read only published products (and their images,
  colors, sizes, active variants), active categories/collections, published testimonials and public settings.
- Inquiries and contact messages are **not writable by anon**. Public forms post to Server Actions that
  validate with Zod, check a honeypot + minimum fill time + link spam, rate-limit by hashed IP
  (Postgres-backed, works on serverless) and then call `submit_inquiry()` with the service role.
  Product names and prices are **re-read from the database** — never trusted from the browser.
- Inquiry numbers (`GR-2026-00001`) are generated atomically per year by `next_inquiry_number()`.
- Admin access = `profiles.role = 'admin'` and `is_active`. It is checked in the proxy (session),
  in the admin layout, in **every** server action (`withAdmin`) and again by RLS (`is_admin()`).
  Role changes by non-admins are blocked by a trigger.
- Storage bucket `media` is public-read; upload/update/delete are admin-only via storage policies.
- `SUPABASE_SERVICE_ROLE_KEY` is only imported from `server-only` modules.

## 3. Create the first admin

Option A (recommended): create a user in **Supabase → Authentication → Users → Add user**, then:

```bash
npm run admin:promote -- you@example.com
```

Option B: create and promote in one step (password is typed in a hidden prompt):

```bash
npm run admin:create -- you@example.com
```

Then sign in at `/admin/login`. For invitations and password reset, add
`https://YOUR-DOMAIN/admin/auth/set-password` (and `http://localhost:3000/admin/auth/set-password`)
to **Authentication → URL Configuration → Redirect URLs**.

## 4. Run locally

```bash
npm run dev        # http://localhost:3000  (Indonesian: /id)
npm run typecheck
npm run build
```

## 5. Deploy to Vercel

1. Push the repository and import it in Vercel (framework preset: Next.js).
2. Add the environment variables from step 1 (not `DATABASE_URL`).
3. Choose a function region close to your Supabase region.
4. Set `NEXT_PUBLIC_SITE_URL` to the production domain and update Supabase redirect URLs.

## 6. Replacing demo content

Everything marked **demo** must be replaced before launch:

- **Admin → Settings → Business & contact:** email, WhatsApp number, address, hours, socials. Untick
  “Contact details are still demo placeholders”.
- **Admin → Settings → Language & currency:** USD → IDR exchange rate.
- **Admin → Testimonials:** delete the 3 sample testimonials; add only real, permitted reviews.
- **Admin → Website Content → Trusted clients:** remove the placeholder logos.
- **Admin → Website Content → About · Verified company facts:** add figures only after verifying them.
- **Products:** product images in `/public/demo` are illustrated placeholders labelled “DEMO IMAGE”.
  Upload real photography per product (multiple upload, drag to reorder, set primary, alt text EN/ID,
  link to color variants).
- **Privacy Policy / Terms / Shipping:** templates — review with a legal advisor.
- Demo inquiries (`GR-DEMO-…`) and demo messages can be archived or deleted.

Regenerate placeholder illustrations with `node scripts/generate-demo-images.mjs`.

## 7. Project structure

```
messages/                 en.json, id.json (all UI copy)
scripts/                  migrate, seed, admin tools, demo image generator
supabase/migrations/      SQL schema, functions, RLS, storage
src/app/[locale]/         public pages (EN default without prefix, /id for Indonesian)
src/app/admin/            login, dashboard (route group), server actions
src/app/api/              product JSON endpoints, CSV export
src/components/           ui, layout, product, catalog, inquiry, forms, admin
src/lib/                  supabase clients, data access, currency, validation, SEO, WhatsApp
src/stores/               favorites, inquiry cart, recently viewed (localStorage)
src/proxy.ts              i18n routing + admin session guard
```

## 8. Pricing & currency rules

- Prices are stored in USD; IDR uses the optional per-product IDR price or `USD × rate`, rounded to Rp1.000.
- Formats: `$1,250` and `Rp19.500.000`.
- Price display types: Starting From, Estimated Price, Fixed Display Price, Contact for Price,
  Wholesale Price on Request. Cart totals are labelled as estimates, never as invoices.
