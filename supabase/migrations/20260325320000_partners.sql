-- ЦКР Этап 23: Партнёрская сеть — организации, участники, партнёрства

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.organization_type as enum (
  'company',
  'bank',
  'fund',
  'supplier',
  'university',
  'association',
  'government',
  'other'
);

create type public.organization_verification_status as enum (
  'unverified',
  'pending',
  'verified'
);

create type public.organization_member_role as enum (
  'owner',
  'manager',
  'employee'
);

create type public.partnership_type as enum (
  'strategic',
  'supplier',
  'investment',
  'technology',
  'expert'
);

create type public.partnership_status as enum (
  'pending',
  'active',
  'inactive'
);

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.organization_type not null default 'company',
  description text not null default '',
  website text not null default '',
  region text not null default '',
  city text not null default '',
  verification_status public.organization_verification_status
    not null default 'unverified',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_type_idx on public.organizations (type);
create index organizations_verification_status_idx
  on public.organizations (verification_status);
create index organizations_region_idx on public.organizations (region);
create index organizations_created_at_idx
  on public.organizations (created_at desc);

comment on table public.organizations is
  'Организации партнёрской сети ЦКР';

create trigger organizations_set_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------------
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.organization_member_role not null default 'employee',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_org_idx
  on public.organization_members (organization_id);
create index organization_members_user_idx
  on public.organization_members (user_id);

comment on table public.organization_members is
  'Участники организаций партнёрской сети ЦКР';

-- ---------------------------------------------------------------------------
-- Helper: membership / manage
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(org_id uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = uid
  );
$$;

create or replace function public.can_manage_org(org_id uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin(uid)
    or exists (
      select 1
      from public.organization_members m
      where m.organization_id = org_id
        and m.user_id = uid
        and m.role in ('owner', 'manager')
    );
$$;

-- ---------------------------------------------------------------------------
-- partnerships
-- ---------------------------------------------------------------------------
create table public.partnerships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  type public.partnership_type not null default 'strategic',
  status public.partnership_status not null default 'pending',
  description text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index partnerships_org_idx on public.partnerships (organization_id);
create index partnerships_status_idx on public.partnerships (status);
create index partnerships_type_idx on public.partnerships (type);

comment on table public.partnerships is
  'Партнёрства организаций с экосистемой ЦКР';

create trigger partnerships_set_updated_at
before update on public.partnerships
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Связь сущностей платформы с организацией
-- ---------------------------------------------------------------------------
alter table public.projects
  add column if not exists organization_id uuid
    references public.organizations (id) on delete set null;

alter table public.opportunities
  add column if not exists organization_id uuid
    references public.organizations (id) on delete set null;

alter table public.investment_offers
  add column if not exists organization_id uuid
    references public.organizations (id) on delete set null;

create index if not exists projects_organization_id_idx
  on public.projects (organization_id);
create index if not exists opportunities_organization_id_idx
  on public.opportunities (organization_id);
create index if not exists investment_offers_organization_id_idx
  on public.investment_offers (organization_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.partnerships enable row level security;

-- organizations: публичное чтение verified; участники видят свою; admin — все
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
    and public.is_org_member(id, auth.uid())
  )
);

drop policy if exists "organizations_insert" on public.organizations;
create policy "organizations_insert"
on public.organizations
for insert
to authenticated
with check (
  created_by = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists "organizations_update" on public.organizations;
create policy "organizations_update"
on public.organizations
for update
to authenticated
using (public.can_manage_org(id, auth.uid()))
with check (public.can_manage_org(id, auth.uid()));

drop policy if exists "organizations_delete" on public.organizations;
create policy "organizations_delete"
on public.organizations
for delete
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1 from public.organization_members m
    where m.organization_id = id
      and m.user_id = auth.uid()
      and m.role = 'owner'
  )
);

-- members
drop policy if exists "organization_members_select" on public.organization_members;
create policy "organization_members_select"
on public.organization_members
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or user_id = auth.uid()
  or public.is_org_member(organization_id, auth.uid())
);

drop policy if exists "organization_members_insert" on public.organization_members;
create policy "organization_members_insert"
on public.organization_members
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
  or public.can_manage_org(organization_id, auth.uid())
  or (
    -- создатель организации добавляет себя как owner при регистрации
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and o.created_by = auth.uid()
    )
  )
);

drop policy if exists "organization_members_update" on public.organization_members;
create policy "organization_members_update"
on public.organization_members
for update
to authenticated
using (public.can_manage_org(organization_id, auth.uid()))
with check (public.can_manage_org(organization_id, auth.uid()));

drop policy if exists "organization_members_delete" on public.organization_members;
create policy "organization_members_delete"
on public.organization_members
for delete
to authenticated
using (
  public.can_manage_org(organization_id, auth.uid())
  or user_id = auth.uid()
);

-- partnerships
drop policy if exists "partnerships_select" on public.partnerships;
create policy "partnerships_select"
on public.partnerships
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or public.is_org_member(organization_id, auth.uid())
  or status = 'active'
);

drop policy if exists "partnerships_insert" on public.partnerships;
create policy "partnerships_insert"
on public.partnerships
for insert
to authenticated
with check (
  public.can_manage_org(organization_id, auth.uid())
);

drop policy if exists "partnerships_update" on public.partnerships;
create policy "partnerships_update"
on public.partnerships
for update
to authenticated
using (
  public.can_manage_org(organization_id, auth.uid())
  or public.is_admin(auth.uid())
)
with check (
  public.can_manage_org(organization_id, auth.uid())
  or public.is_admin(auth.uid())
);

drop policy if exists "partnerships_delete" on public.partnerships;
create policy "partnerships_delete"
on public.partnerships
for delete
to authenticated
using (
  public.can_manage_org(organization_id, auth.uid())
  or public.is_admin(auth.uid())
);
