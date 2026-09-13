-- =====================================================================
-- Global Rotan — Storage (public bucket, admin-only writes)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  8388608, -- 8 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media: admin read" on storage.objects;
drop policy if exists "media: admin insert" on storage.objects;
drop policy if exists "media: admin update" on storage.objects;
drop policy if exists "media: admin delete" on storage.objects;

-- Files are served through the public URL; listing requires admin.
create policy "media: admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and public.is_admin());

create policy "media: admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

create policy "media: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy "media: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
