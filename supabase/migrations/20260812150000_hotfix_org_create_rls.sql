-- HOTFIX: создание организации блокируется RLS
--
-- Root cause (production verified):
-- 1) INSERT into organizations succeeds (organizations_insert allows created_by = auth.uid()).
-- 2) PostgREST INSERT...RETURNING / supabase-js .select() requires SELECT on the new row.
-- 3) organizations_select only allows verified | admin | is_org_member — creator is not yet
--    a member and verification_status = 'unverified' → RLS error surfaced as INSERT failure.
-- 4) organization_members_insert uses EXISTS on organizations under caller RLS, so even
--    insert-without-returning cannot add owner membership until SELECT allows created_by.
--
-- Fix: allow creator SELECT; SECURITY DEFINER creator check for membership; atomic RPC.

-- ---------------------------------------------------------------------------
-- 1) organizations SELECT: creator can read own row
-- ---------------------------------------------------------------------------
drop policy if exists "organizations_select" on public.organizations;
create policy "organizations_select"
on public.organizations
for select
to anon, authenticated
using (
  verification_status = 'verified'
  or public.is_admin(auth.uid())
  or (
    auth.uid() is not null
    and (
      created_by = auth.uid()
      or public.is_org_member(id, auth.uid())
    )
  )
);

-- ---------------------------------------------------------------------------
-- 2) SECURITY DEFINER: creator check (bypasses SELECT RLS for policy predicates)
-- ---------------------------------------------------------------------------
create or replace function public.is_org_creator(org_id uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = org_id
      and o.created_by = uid
  );
$$;

revoke all on function public.is_org_creator(uuid, uuid) from public;
grant execute on function public.is_org_creator(uuid, uuid)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3) membership INSERT: use is_org_creator instead of RLS-sensitive EXISTS
-- ---------------------------------------------------------------------------
drop policy if exists "organization_members_insert" on public.organization_members;
create policy "organization_members_insert"
on public.organization_members
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
  or public.can_manage_org(organization_id, auth.uid())
  or (
    user_id = auth.uid()
    and role = 'owner'
    and public.is_org_creator(organization_id, auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- 4) Atomic create + owner membership; created_by forced to auth.uid()
--    Idempotent for double-submit: same creator + same name within 2 minutes.
-- ---------------------------------------------------------------------------
create or replace function public.create_organization_with_owner(
  p_name text,
  p_type public.organization_type default 'company',
  p_description text default '',
  p_website text default '',
  p_region text default '',
  p_city text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_org_id uuid;
  v_name text := nullif(btrim(p_name), '');
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if v_name is null or char_length(v_name) < 2 then
    raise exception 'invalid organization name' using errcode = '22023';
  end if;

  -- Serialize double-clicks for the same user+name
  perform pg_advisory_xact_lock(
    hashtext(v_uid::text || ':' || lower(v_name))
  );

  select o.id
    into v_org_id
  from public.organizations o
  where o.created_by = v_uid
    and lower(o.name) = lower(v_name)
    and o.created_at > now() - interval '2 minutes'
  order by o.created_at desc
  limit 1;

  if v_org_id is not null then
    insert into public.organization_members as m (organization_id, user_id, role)
    values (v_org_id, v_uid, 'owner')
    on conflict (organization_id, user_id) do nothing;
    return v_org_id;
  end if;

  insert into public.organizations (
    name,
    type,
    description,
    website,
    region,
    city,
    created_by,
    verification_status
  ) values (
    v_name,
    coalesce(p_type, 'company'::public.organization_type),
    coalesce(p_description, ''),
    coalesce(p_website, ''),
    coalesce(p_region, ''),
    coalesce(p_city, ''),
    v_uid, -- force owner/creator = caller; ignore client spoofing
    'unverified'::public.organization_verification_status
  )
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, v_uid, 'owner')
  on conflict (organization_id, user_id) do nothing;

  return v_org_id;
end;
$$;

revoke all on function public.create_organization_with_owner(
  text,
  public.organization_type,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.create_organization_with_owner(
  text,
  public.organization_type,
  text,
  text,
  text,
  text
) to authenticated;

comment on function public.create_organization_with_owner(
  text,
  public.organization_type,
  text,
  text,
  text,
  text
) is
  'Atomic org create + owner membership; created_by always auth.uid(); idempotent 2min window';
