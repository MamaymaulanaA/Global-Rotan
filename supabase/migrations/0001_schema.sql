-- =====================================================================
-- Global Rotan — core schema
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  is_active boolean not null default true,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en text not null,
  name_id text not null,
  description_en text,
  description_id text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists categories_active_sort_idx on public.categories (is_active, sort_order);

-- ---------------------------------------------------------------------
-- collections
-- ---------------------------------------------------------------------
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en text not null,
  name_id text not null,
  tagline_en text,
  tagline_id text,
  description_en text,
  description_id text,
  image_url text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists collections_active_sort_idx on public.collections (is_active, sort_order);

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku text not null unique,
  name_en text not null,
  name_id text not null,
  short_description_en text,
  short_description_id text,
  description_en text,
  description_id text,
  category_id uuid references public.categories (id) on delete set null,
  collection_id uuid references public.collections (id) on delete set null,

  base_price_usd numeric(12, 2) check (base_price_usd is null or base_price_usd >= 0),
  price_idr numeric(16, 0) check (price_idr is null or price_idr >= 0),
  price_display_type text not null default 'starting_from'
    check (price_display_type in ('starting_from', 'estimated', 'fixed', 'contact', 'wholesale_request')),

  materials text[] not null default '{}',
  material_detail_en text,
  material_detail_id text,
  finishing_en text,
  finishing_id text,
  finishing_options jsonb not null default '[]'::jsonb,
  usage text not null default 'indoor' check (usage in ('indoor', 'outdoor', 'both')),

  width_cm numeric(8, 1),
  depth_cm numeric(8, 1),
  height_cm numeric(8, 1),
  seat_height_cm numeric(8, 1),
  weight_kg numeric(8, 2),
  specs jsonb not null default '[]'::jsonb,

  moq integer not null default 1 check (moq >= 1),
  lead_time_min_weeks integer check (lead_time_min_weeks is null or lead_time_min_weeks >= 0),
  lead_time_max_weeks integer check (lead_time_max_weeks is null or lead_time_max_weeks >= 0),
  availability text not null default 'made_to_order' check (availability in ('ready_stock', 'made_to_order')),

  care_en text,
  care_id text,
  customization_en text,
  customization_id text,

  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_best_seller boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,

  seo_title_en text,
  seo_title_id text,
  meta_description_en text,
  meta_description_id text,

  color_families text[] not null default '{}',
  search_text text generated always as (
    lower(
      coalesce(name_en, '') || ' ' || coalesce(name_id, '') || ' ' || coalesce(sku, '') || ' ' ||
      coalesce(short_description_en, '') || ' ' || coalesce(short_description_id, '') || ' ' ||
      coalesce(material_detail_en, '') || ' ' || coalesce(material_detail_id, '')
    )
  ) stored,

  published_at timestamptz,
  archived_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint products_lead_time_range check (
    lead_time_min_weeks is null or lead_time_max_weeks is null or lead_time_min_weeks <= lead_time_max_weeks
  )
);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_collection_idx on public.products (collection_id);
create index if not exists products_featured_idx on public.products (status, is_featured, sort_order);
create index if not exists products_created_idx on public.products (created_at desc);
create index if not exists products_price_idx on public.products (base_price_usd);
create index if not exists products_materials_idx on public.products using gin (materials);
create index if not exists products_color_families_idx on public.products using gin (color_families);
create index if not exists products_search_trgm_idx on public.products using gin (search_text extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------
-- product colors / sizes / variants / images
-- ---------------------------------------------------------------------
create table if not exists public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name_en text not null,
  name_id text not null,
  hex text not null default '#C8A46A' check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  family text not null default 'natural'
    check (family in ('natural', 'honey', 'brown', 'black', 'white', 'grey', 'green', 'blue', 'other')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_colors_product_idx on public.product_colors (product_id, sort_order);

create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label_en text not null,
  label_id text not null,
  width_cm numeric(8, 1),
  depth_cm numeric(8, 1),
  height_cm numeric(8, 1),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_sizes_product_idx on public.product_sizes (product_id, sort_order);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_id uuid references public.product_colors (id) on delete set null,
  storage_path text,
  url text not null,
  alt_en text,
  alt_id text,
  width integer,
  height integer,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);
create unique index if not exists product_images_one_primary_idx
  on public.product_images (product_id) where is_primary;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_id uuid references public.product_colors (id) on delete cascade,
  size_id uuid references public.product_sizes (id) on delete cascade,
  sku text unique,
  material_en text,
  material_id text,
  finishing_en text,
  finishing_id text,
  price_adjustment_usd numeric(12, 2) not null default 0,
  availability text not null default 'available'
    check (availability in ('available', 'made_to_order', 'unavailable')),
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  image_id uuid references public.product_images (id) on delete set null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_variants_product_idx on public.product_variants (product_id);
create unique index if not exists product_variants_combo_idx
  on public.product_variants (product_id, coalesce(color_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(size_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ---------------------------------------------------------------------
-- favorites (reserved for logged-in customers)
-- ---------------------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ---------------------------------------------------------------------
-- inquiries
-- ---------------------------------------------------------------------
create table if not exists public.inquiry_counters (
  year integer primary key,
  last_value integer not null default 0
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_number text not null unique,
  status text not null default 'new' check (status in (
    'new', 'contacted', 'quotation_sent', 'negotiation', 'confirmed', 'in_production', 'completed', 'cancelled'
  )),
  full_name text not null,
  company_name text,
  email text not null,
  phone_country_code text not null,
  phone_number text not null,
  country text not null,
  customer_type text not null check (customer_type in (
    'individual', 'retailer', 'distributor', 'interior_designer', 'architect', 'hotel_restaurant', 'project_owner', 'other'
  )),
  shipping_destination text not null,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'id')),
  preferred_currency text not null default 'USD' check (preferred_currency in ('USD', 'IDR')),
  estimated_budget text,
  required_delivery_date date,
  customization_request text,
  message text,
  privacy_accepted_at timestamptz not null,
  locale text not null default 'en',
  source_url text,
  exchange_rate_used numeric(12, 2),
  estimated_total_usd numeric(14, 2),

  quoted_price numeric(16, 2),
  quoted_currency text check (quoted_currency is null or quoted_currency in ('USD', 'IDR')),
  shipping_estimate numeric(16, 2),
  quoted_moq integer,
  followed_up_at timestamptz,
  followed_up_by uuid references auth.users (id) on delete set null,
  is_archived boolean not null default false,
  archived_at timestamptz,
  is_demo boolean not null default false,
  ip_hash text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inquiries_status_idx on public.inquiries (status, created_at desc);
create index if not exists inquiries_created_idx on public.inquiries (created_at desc);
create index if not exists inquiries_country_idx on public.inquiries (country);
create index if not exists inquiries_email_idx on public.inquiries (lower(email));
create index if not exists inquiries_archived_idx on public.inquiries (is_archived);

create table if not exists public.inquiry_items (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name_en text not null,
  product_name_id text,
  sku text,
  variant_sku text,
  color_name text,
  size_label text,
  finishing text,
  quantity integer not null check (quantity > 0 and quantity <= 100000),
  note text,
  unit_price_usd numeric(12, 2),
  price_display_type text,
  image_url text,
  product_url text,
  created_at timestamptz not null default now()
);
create index if not exists inquiry_items_inquiry_idx on public.inquiry_items (inquiry_id);
create index if not exists inquiry_items_product_idx on public.inquiry_items (product_id);

create table if not exists public.inquiry_notes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_email text,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists inquiry_notes_inquiry_idx on public.inquiry_notes (inquiry_id, created_at desc);

-- ---------------------------------------------------------------------
-- contact messages
-- ---------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  topic text not null default 'general' check (topic in ('general', 'product', 'project', 'export')),
  full_name text not null,
  email text not null,
  phone text,
  company_name text,
  country text,
  subject text,
  message text not null,
  product_id uuid references public.products (id) on delete set null,
  product_url text,
  locale text not null default 'en',
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  is_demo boolean not null default false,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);

-- ---------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role_en text,
  author_role_id text,
  company_name text,
  country text,
  quote_en text not null,
  quote_id text not null,
  rating smallint check (rating is null or rating between 1 and 5),
  avatar_url text,
  is_demo boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists testimonials_published_idx on public.testimonials (is_published, sort_order);

-- ---------------------------------------------------------------------
-- site settings (key/value)
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- activity logs
-- ---------------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_created_idx on public.activity_logs (created_at desc);
create index if not exists activity_logs_entity_idx on public.activity_logs (entity_type, entity_id);

-- ---------------------------------------------------------------------
-- rate limits (server-only)
-- ---------------------------------------------------------------------
create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'categories', 'collections', 'products', 'product_colors', 'product_sizes',
    'product_images', 'product_variants', 'inquiries', 'contact_messages', 'testimonials', 'site_settings'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;
