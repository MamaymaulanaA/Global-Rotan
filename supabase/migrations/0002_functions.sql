-- =====================================================================
-- Global Rotan — functions & triggers
-- =====================================================================

-- ---------------------------------------------------------------------
-- Role helper (security definer so it can be used inside RLS policies)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.is_active
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Create a profile for every new auth user (role defaults to 'user')
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', null))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
     set email = new.email,
         last_sign_in_at = new.last_sign_in_at
   where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, last_sign_in_at on auth.users
  for each row execute function public.handle_user_updated();

-- Only admins may change roles / activation (also enforced by RLS)
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- session_user is 'authenticator' for API requests; direct DB sessions (migrations/scripts) are trusted.
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
     and session_user = 'authenticator'
     and coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin() then
    raise exception 'not_allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------
-- Product lifecycle timestamps
-- ---------------------------------------------------------------------
create or replace function public.products_status_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  if new.status = 'archived' then
    new.archived_at = coalesce(new.archived_at, now());
  else
    new.archived_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists products_status_timestamps on public.products;
create trigger products_status_timestamps
  before insert or update of status on public.products
  for each row execute function public.products_status_timestamps();

-- ---------------------------------------------------------------------
-- Keep products.color_families in sync with product_colors
-- ---------------------------------------------------------------------
create or replace function public.sync_product_color_families()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
     set color_families = coalesce(
       (select array_agg(distinct c.family order by c.family) from public.product_colors c where c.product_id = v_product),
       '{}'
     )
   where p.id = v_product;
  if tg_op = 'UPDATE' and old.product_id is distinct from new.product_id then
    update public.products p
       set color_families = coalesce(
         (select array_agg(distinct c.family order by c.family) from public.product_colors c where c.product_id = old.product_id),
         '{}'
       )
     where p.id = old.product_id;
  end if;
  return null;
end;
$$;

drop trigger if exists sync_product_color_families on public.product_colors;
create trigger sync_product_color_families
  after insert or update or delete on public.product_colors
  for each row execute function public.sync_product_color_families();

-- ---------------------------------------------------------------------
-- Public: product counts per category (published only)
-- ---------------------------------------------------------------------
create or replace function public.category_product_counts()
returns table (category_id uuid, product_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select p.category_id, count(*)::bigint
    from public.products p
   where p.status = 'published' and p.category_id is not null
   group by p.category_id;
$$;
revoke all on function public.category_product_counts() from public;
grant execute on function public.category_product_counts() to anon, authenticated, service_role;

create or replace function public.collection_product_counts()
returns table (collection_id uuid, product_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select p.collection_id, count(*)::bigint
    from public.products p
   where p.status = 'published' and p.collection_id is not null
   group by p.collection_id;
$$;
revoke all on function public.collection_product_counts() from public;
grant execute on function public.collection_product_counts() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Rate limiting (server-only, fixed window)
-- ---------------------------------------------------------------------
create or replace function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  insert into public.rate_limits as rl (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1 else rl.hits + 1 end,
        window_start = case when rl.window_start < now() - make_interval(secs => p_window_seconds) then now() else rl.window_start end
  returning hits into v_hits;

  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end;
$$;
revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------
-- Inquiry number: GR-YYYY-00001 (atomic per year)
-- ---------------------------------------------------------------------
create or replace function public.next_inquiry_number()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year integer := extract(year from (now() at time zone 'Asia/Jakarta'))::integer;
  v_value integer;
begin
  insert into public.inquiry_counters as c (year, last_value)
  values (v_year, 1)
  on conflict (year) do update set last_value = c.last_value + 1
  returning last_value into v_value;
  return 'GR-' || v_year::text || '-' || lpad(v_value::text, 5, '0');
end;
$$;
revoke all on function public.next_inquiry_number() from public, anon, authenticated;
grant execute on function public.next_inquiry_number() to service_role;

-- ---------------------------------------------------------------------
-- Submit inquiry (called by the server after validation + rate limiting).
-- Product data and prices are re-read from the database — never trusted
-- from the client.
-- ---------------------------------------------------------------------
create or replace function public.submit_inquiry(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inquiry_id uuid;
  v_number text;
  v_item jsonb;
  v_product public.products%rowtype;
  v_color public.product_colors%rowtype;
  v_size public.product_sizes%rowtype;
  v_variant public.product_variants%rowtype;
  v_unit numeric(12, 2);
  v_total numeric(14, 2) := 0;
  v_has_total boolean := false;
  v_image text;
  v_site text := coalesce(nullif(payload ->> 'site_url', ''), '');
  v_count integer := 0;
  v_rate numeric(12, 2);
begin
  if jsonb_typeof(payload -> 'items') <> 'array' or jsonb_array_length(payload -> 'items') = 0 then
    raise exception 'items_required';
  end if;
  if jsonb_array_length(payload -> 'items') > 50 then
    raise exception 'too_many_items';
  end if;

  select nullif(s.value ->> 'usd_to_idr', '')::numeric into v_rate
    from public.site_settings s where s.key = 'localization';

  v_number := public.next_inquiry_number();

  insert into public.inquiries (
    inquiry_number, full_name, company_name, email, phone_country_code, phone_number, country,
    customer_type, shipping_destination, preferred_language, preferred_currency, estimated_budget,
    required_delivery_date, customization_request, message, privacy_accepted_at, locale, source_url,
    exchange_rate_used, ip_hash
  ) values (
    v_number,
    payload ->> 'full_name',
    nullif(payload ->> 'company_name', ''),
    lower(payload ->> 'email'),
    payload ->> 'phone_country_code',
    payload ->> 'phone_number',
    payload ->> 'country',
    payload ->> 'customer_type',
    payload ->> 'shipping_destination',
    coalesce(nullif(payload ->> 'preferred_language', ''), 'en'),
    coalesce(nullif(payload ->> 'preferred_currency', ''), 'USD'),
    nullif(payload ->> 'estimated_budget', ''),
    nullif(payload ->> 'required_delivery_date', '')::date,
    nullif(payload ->> 'customization_request', ''),
    nullif(payload ->> 'message', ''),
    now(),
    coalesce(nullif(payload ->> 'locale', ''), 'en'),
    nullif(payload ->> 'source_url', ''),
    v_rate,
    nullif(payload ->> 'ip_hash', '')
  )
  returning id into v_inquiry_id;

  for v_item in select * from jsonb_array_elements(payload -> 'items')
  loop
    select * into v_product
      from public.products p
     where p.id = (v_item ->> 'product_id')::uuid and p.status = 'published';
    if not found then
      raise exception 'product_unavailable';
    end if;

    v_color := null;
    v_size := null;
    v_variant := null;

    if nullif(v_item ->> 'color_id', '') is not null then
      select * into v_color from public.product_colors c
       where c.id = (v_item ->> 'color_id')::uuid and c.product_id = v_product.id;
      if not found then raise exception 'variant_unavailable'; end if;
    end if;

    if nullif(v_item ->> 'size_id', '') is not null then
      select * into v_size from public.product_sizes s
       where s.id = (v_item ->> 'size_id')::uuid and s.product_id = v_product.id;
      if not found then raise exception 'variant_unavailable'; end if;
    end if;

    select * into v_variant
      from public.product_variants v
     where v.product_id = v_product.id
       and v.is_active
       and (v.color_id is null or v.color_id = v_color.id)
       and (v.size_id is null or v.size_id = v_size.id)
     order by ((v.color_id is not null)::int + (v.size_id is not null)::int) desc
     limit 1;

    if found and v_variant.availability = 'unavailable' then
      raise exception 'variant_unavailable';
    end if;

    if v_product.price_display_type in ('contact', 'wholesale_request') or v_product.base_price_usd is null then
      v_unit := null;
    else
      v_unit := v_product.base_price_usd + coalesce(v_variant.price_adjustment_usd, 0);
      v_total := v_total + v_unit * greatest((v_item ->> 'quantity')::integer, 1);
      v_has_total := true;
    end if;

    select i.url into v_image
      from public.product_images i
     where i.product_id = v_product.id
     order by coalesce(v_color.id is not null and i.color_id = v_color.id, false) desc, i.is_primary desc, i.sort_order
     limit 1;

    insert into public.inquiry_items (
      inquiry_id, product_id, product_name_en, product_name_id, sku, variant_sku, color_name, size_label,
      finishing, quantity, note, unit_price_usd, price_display_type, image_url, product_url
    ) values (
      v_inquiry_id,
      v_product.id,
      v_product.name_en,
      v_product.name_id,
      v_product.sku,
      v_variant.sku,
      case when v_color.id is null then null
           when v_color.name_en = v_color.name_id then v_color.name_en
           else v_color.name_en || ' / ' || v_color.name_id end,
      case when v_size.id is null then null
           when v_size.label_en = v_size.label_id then v_size.label_en
           else v_size.label_en || ' / ' || v_size.label_id end,
      nullif(left(v_item ->> 'finishing', 120), ''),
      greatest((v_item ->> 'quantity')::integer, 1),
      nullif(left(v_item ->> 'note', 1000), ''),
      v_unit,
      v_product.price_display_type,
      v_image,
      v_site || '/products/' || v_product.slug
    );
    v_count := v_count + 1;
  end loop;

  update public.inquiries
     set estimated_total_usd = case when v_has_total then v_total else null end
   where id = v_inquiry_id;

  return jsonb_build_object('id', v_inquiry_id, 'inquiry_number', v_number, 'item_count', v_count);
end;
$$;
revoke all on function public.submit_inquiry(jsonb) from public, anon, authenticated;
grant execute on function public.submit_inquiry(jsonb) to service_role;

-- ---------------------------------------------------------------------
-- Admin: duplicate product with its colors, sizes, images & variants
-- ---------------------------------------------------------------------
create or replace function public.duplicate_product(p_product_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_id uuid;
  v_suffix text := substr(md5(random()::text), 1, 5);
  r record;
  v_new_child uuid;
  v_map jsonb := '{}'::jsonb;
begin
  if not public.is_admin() then
    raise exception 'not_allowed';
  end if;

  insert into public.products (
    slug, sku, name_en, name_id, short_description_en, short_description_id, description_en, description_id,
    category_id, collection_id, base_price_usd, price_idr, price_display_type, materials, material_detail_en,
    material_detail_id, finishing_en, finishing_id, finishing_options, usage, width_cm, depth_cm, height_cm,
    seat_height_cm, weight_kg, specs, moq, lead_time_min_weeks, lead_time_max_weeks, availability, care_en,
    care_id, customization_en, customization_id, is_featured, is_new, is_best_seller, status, sort_order,
    seo_title_en, seo_title_id, meta_description_en, meta_description_id, created_by, updated_by
  )
  select
    left(p.slug, 70) || '-copy-' || v_suffix, p.sku || '-COPY-' || upper(v_suffix), p.name_en || ' (Copy)',
    p.name_id || ' (Salinan)', p.short_description_en, p.short_description_id, p.description_en, p.description_id,
    p.category_id, p.collection_id, p.base_price_usd, p.price_idr, p.price_display_type, p.materials,
    p.material_detail_en, p.material_detail_id, p.finishing_en, p.finishing_id, p.finishing_options, p.usage,
    p.width_cm, p.depth_cm, p.height_cm, p.seat_height_cm, p.weight_kg, p.specs, p.moq, p.lead_time_min_weeks,
    p.lead_time_max_weeks, p.availability, p.care_en, p.care_id, p.customization_en, p.customization_id,
    false, p.is_new, false, 'draft', p.sort_order, p.seo_title_en, p.seo_title_id, p.meta_description_en,
    p.meta_description_id, auth.uid(), auth.uid()
  from public.products p
  where p.id = p_product_id
  returning id into v_new_id;

  if v_new_id is null then
    raise exception 'not_found';
  end if;

  for r in select * from public.product_colors where product_id = p_product_id order by sort_order loop
    insert into public.product_colors (product_id, name_en, name_id, hex, family, sort_order)
    values (v_new_id, r.name_en, r.name_id, r.hex, r.family, r.sort_order)
    returning id into v_new_child;
    v_map := v_map || jsonb_build_object(r.id::text, v_new_child);
  end loop;

  for r in select * from public.product_sizes where product_id = p_product_id order by sort_order loop
    insert into public.product_sizes (product_id, label_en, label_id, width_cm, depth_cm, height_cm, sort_order)
    values (v_new_id, r.label_en, r.label_id, r.width_cm, r.depth_cm, r.height_cm, r.sort_order)
    returning id into v_new_child;
    v_map := v_map || jsonb_build_object(r.id::text, v_new_child);
  end loop;

  for r in select * from public.product_images where product_id = p_product_id order by sort_order loop
    insert into public.product_images (product_id, color_id, storage_path, url, alt_en, alt_id, width, height, is_primary, sort_order, created_by)
    values (
      v_new_id, (v_map ->> r.color_id::text)::uuid, null, r.url, r.alt_en, r.alt_id,
      r.width, r.height, r.is_primary, r.sort_order, auth.uid()
    )
    returning id into v_new_child;
    v_map := v_map || jsonb_build_object(r.id::text, v_new_child);
  end loop;

  insert into public.product_variants (
    product_id, color_id, size_id, sku, material_en, material_id, finishing_en, finishing_id,
    price_adjustment_usd, availability, stock_quantity, image_id, is_active, sort_order
  )
  select
    v_new_id,
    (v_map ->> v.color_id::text)::uuid,
    (v_map ->> v.size_id::text)::uuid,
    case when v.sku is null then null else v.sku || '-COPY-' || upper(v_suffix) end,
    v.material_en, v.material_id, v.finishing_en, v.finishing_id, v.price_adjustment_usd, v.availability,
    v.stock_quantity, (v_map ->> v.image_id::text)::uuid, v.is_active, v.sort_order
  from public.product_variants v
  where v.product_id = p_product_id;

  return v_new_id;
end;
$$;
revoke all on function public.duplicate_product(uuid) from public, anon;
grant execute on function public.duplicate_product(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Admin: overview statistics in one round trip
-- ---------------------------------------------------------------------
create or replace function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_month_start timestamptz := date_trunc('month', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
begin
  if not public.is_admin() then
    raise exception 'not_allowed';
  end if;

  select jsonb_build_object(
    'products', (
      select jsonb_build_object(
        'total', count(*),
        'published', count(*) filter (where status = 'published'),
        'draft', count(*) filter (where status = 'draft'),
        'archived', count(*) filter (where status = 'archived'),
        'ready_stock', count(*) filter (where availability = 'ready_stock' and status = 'published')
      ) from public.products
    ),
    'inquiries', (
      select jsonb_build_object(
        'new', count(*) filter (where status = 'new' and not is_archived),
        'this_month', count(*) filter (where created_at >= v_month_start),
        'total', count(*)
      ) from public.inquiries
    ),
    'inquiries_by_status', (
      select coalesce(jsonb_object_agg(status, c), '{}'::jsonb)
        from (select status, count(*) as c from public.inquiries where not is_archived group by status) s
    ),
    'top_products', (
      select coalesce(jsonb_agg(t order by t.requests desc), '[]'::jsonb)
        from (
          select ii.product_id, max(ii.product_name_en) as name, max(ii.sku) as sku,
                 count(distinct ii.inquiry_id) as requests, sum(ii.quantity) as quantity
            from public.inquiry_items ii
           group by ii.product_id
           order by count(distinct ii.inquiry_id) desc
           limit 5
        ) t
    ),
    'countries', (
      select coalesce(jsonb_agg(t order by t.count desc), '[]'::jsonb)
        from (
          select country, count(*) as count from public.inquiries group by country order by count(*) desc limit 8
        ) t
    ),
    'recent_messages', (
      select coalesce(jsonb_agg(t order by t.created_at desc), '[]'::jsonb)
        from (
          select id, full_name, email, subject, topic, status, created_at
            from public.contact_messages order by created_at desc limit 5
        ) t
    ),
    'recent_activity', (
      select coalesce(jsonb_agg(t order by t.created_at desc), '[]'::jsonb)
        from (
          select id, actor_email, action, entity_type, summary, created_at
            from public.activity_logs order by created_at desc limit 8
        ) t
    )
  ) into v_result;

  return v_result;
end;
$$;
revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated, service_role;
