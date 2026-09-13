-- =====================================================================
-- Harden role protection: any request carrying a JWT (anon/authenticated API
-- traffic) may only change role / is_active when the caller is an active admin
-- or uses the service role. Direct database sessions without JWT claims
-- (migrations, admin CLI scripts) remain trusted.
-- =====================================================================
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claims text := nullif(current_setting('request.jwt.claims', true), '');
  v_role text;
begin
  if new.role is distinct from old.role or new.is_active is distinct from old.is_active or new.id is distinct from old.id then
    if v_claims is not null then
      v_role := coalesce(v_claims::jsonb ->> 'role', '');
      if v_role <> 'service_role' and not public.is_admin() then
        raise exception 'not_allowed';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- Users may only edit their own display name; everything else goes through admins.
revoke update on public.profiles from anon;
