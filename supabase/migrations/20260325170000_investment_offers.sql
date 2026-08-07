-- ЦКР Этап 5: investment_offers + обновление helpers заявок

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.investment_type as enum (
  'equity',
  'loan',
  'partnership',
  'purchase'
);

create type public.investment_offer_status as enum (
  'draft',
  'moderation',
  'published',
  'closed'
);

-- ---------------------------------------------------------------------------
-- investment_offers
-- ---------------------------------------------------------------------------
create table public.investment_offers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  amount_min numeric(18, 2) not null default 0,
  amount_max numeric(18, 2) not null default 0,
  currency text not null default 'RUB',
  regions text[] not null default '{}',
  categories text[] not null default '{}',
  investment_type public.investment_type not null default 'equity',
  status public.investment_offer_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investment_offers_amount_check check (amount_max >= amount_min)
);

create index investment_offers_owner_id_idx on public.investment_offers (owner_id);
create index investment_offers_status_idx on public.investment_offers (status);
create index investment_offers_type_idx on public.investment_offers (investment_type);
create index investment_offers_categories_idx on public.investment_offers using gin (categories);
create index investment_offers_regions_idx on public.investment_offers using gin (regions);

comment on table public.investment_offers is 'Инвестиционные предложения участников ЦКР';

create trigger investment_offers_set_updated_at
before update on public.investment_offers
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.investment_offers enable row level security;

create policy "investment_offers_select_published_or_own"
on public.investment_offers
for select
to anon, authenticated
using (
  status = 'published'
  or auth.uid() = owner_id
  or public.is_admin(auth.uid())
);

create policy "investment_offers_insert_own"
on public.investment_offers
for insert
to authenticated
with check (auth.uid() = owner_id);

create policy "investment_offers_update_own"
on public.investment_offers
for update
to authenticated
using (
  auth.uid() = owner_id
  or public.is_admin(auth.uid())
)
with check (
  auth.uid() = owner_id
  or public.is_admin(auth.uid())
);

create policy "investment_offers_delete_own"
on public.investment_offers
for delete
to authenticated
using (
  auth.uid() = owner_id
  or public.is_admin(auth.uid())
);

-- ---------------------------------------------------------------------------
-- Обновить helpers заявок: investment_offers как target
-- ---------------------------------------------------------------------------
create or replace function public.owns_application_target(
  p_target_type public.application_target_type,
  p_target_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_target_type = 'project' then
    return exists (
      select 1 from public.projects
      where id = p_target_id and owner_id = auth.uid()
    );
  end if;

  if p_target_type = 'opportunity' then
    return exists (
      select 1 from public.opportunities
      where id = p_target_id and owner_id = auth.uid()
    );
  end if;

  if p_target_type = 'investment' then
    return exists (
      select 1 from public.investment_offers
      where id = p_target_id and owner_id = auth.uid()
    );
  end if;

  -- expert — позже
  return false;
end;
$$;

create or replace function public.get_application_target_owner(
  p_target_type public.application_target_type,
  p_target_id uuid
)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  if p_target_type = 'project' then
    select owner_id into owner from public.projects where id = p_target_id;
    return owner;
  end if;

  if p_target_type = 'opportunity' then
    select owner_id into owner from public.opportunities where id = p_target_id;
    return owner;
  end if;

  if p_target_type = 'investment' then
    select owner_id into owner from public.investment_offers where id = p_target_id;
    return owner;
  end if;

  return null;
end;
$$;
