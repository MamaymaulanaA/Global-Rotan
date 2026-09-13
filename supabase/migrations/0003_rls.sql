-- =====================================================================
-- Global Rotan — Row Level Security
-- Public: read published catalog only. Admin: full CRUD.
-- Inquiries & messages are written only through server-side RPCs
-- (service role) after validation, rate limiting and spam checks.
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.favorites enable row level security;
alter table public.inquiry_counters enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_items enable row level security;
alter table public.inquiry_notes enable row level security;
alter table public.contact_messages enable row level security;
alter table public.testimonials enable row level security;
alter table public.site_settings enable row level security;
alter table public.activity_logs enable row level security;
alter table public.rate_limits enable row level security;

-- Drop policies so the migration can be re-run safely
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end;
$$;

-- profiles ------------------------------------------------------------
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "profiles: admin update" on public.profiles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "profiles: update own name" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- categories / collections ---------------------------------------------
create policy "categories: public read active" on public.categories
  for select to anon, authenticated
  using (is_active or public.is_admin());
create policy "categories: admin write" on public.categories
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "collections: public read active" on public.collections
  for select to anon, authenticated
  using (is_active or public.is_admin());
create policy "collections: admin write" on public.collections
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- products ----------------------------------------------------------------
create policy "products: public read published" on public.products
  for select to anon, authenticated
  using (status = 'published' or public.is_admin());
create policy "products: admin write" on public.products
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- product children: visible when the parent product is published ----------
create policy "product_colors: public read" on public.product_colors
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
  );
create policy "product_colors: admin write" on public.product_colors
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "product_sizes: public read" on public.product_sizes
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
  );
create policy "product_sizes: admin write" on public.product_sizes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "product_images: public read" on public.product_images
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
  );
create policy "product_images: admin write" on public.product_images
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "product_variants: public read" on public.product_variants
  for select to anon, authenticated
  using (
    public.is_admin()
    or (is_active and exists (select 1 from public.products p where p.id = product_id and p.status = 'published'))
  );
create policy "product_variants: admin write" on public.product_variants
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- favorites (logged-in customers, own rows only) -----------------------------
create policy "favorites: own rows" on public.favorites
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- inquiries: admin only (inserted by submit_inquiry via service role) ---------
create policy "inquiries: admin read" on public.inquiries
  for select to authenticated using (public.is_admin());
create policy "inquiries: admin update" on public.inquiries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "inquiries: admin delete" on public.inquiries
  for delete to authenticated using (public.is_admin());

create policy "inquiry_items: admin read" on public.inquiry_items
  for select to authenticated using (public.is_admin());
create policy "inquiry_items: admin write" on public.inquiry_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "inquiry_notes: admin all" on public.inquiry_notes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- contact messages: admin only ------------------------------------------------
create policy "contact_messages: admin read" on public.contact_messages
  for select to authenticated using (public.is_admin());
create policy "contact_messages: admin update" on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "contact_messages: admin delete" on public.contact_messages
  for delete to authenticated using (public.is_admin());

-- testimonials ------------------------------------------------------------------
create policy "testimonials: public read published" on public.testimonials
  for select to anon, authenticated
  using (is_published or public.is_admin());
create policy "testimonials: admin write" on public.testimonials
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- site settings -------------------------------------------------------------------
create policy "site_settings: public read" on public.site_settings
  for select to anon, authenticated
  using (is_public or public.is_admin());
create policy "site_settings: admin write" on public.site_settings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- activity logs ----------------------------------------------------------------------
create policy "activity_logs: admin read" on public.activity_logs
  for select to authenticated using (public.is_admin());
create policy "activity_logs: admin insert" on public.activity_logs
  for insert to authenticated with check (public.is_admin() and actor_id = auth.uid());

-- inquiry_counters & rate_limits: no policies => no direct access for anon/authenticated.

-- Explicitly remove direct table privileges that anon never needs
revoke insert, update, delete on public.inquiries, public.inquiry_items, public.inquiry_notes,
  public.contact_messages, public.activity_logs, public.rate_limits, public.inquiry_counters
  from anon;
revoke all on public.rate_limits, public.inquiry_counters from anon, authenticated;
