-- ЦКР Этап 6: expert_profiles + расширение profiles

-- ---------------------------------------------------------------------------
-- Расширение profiles (система доверия)
-- ---------------------------------------------------------------------------
create type public.verification_status as enum (
  'unverified',
  'pending',
  'verified'
);

alter table public.profiles
  add column if not exists website text,
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists verification_status public.verification_status
    not null default 'unverified';

comment on column public.profiles.verification_status is 'Статус проверки участника ЦКР';

-- ---------------------------------------------------------------------------
-- expert_profiles
-- ---------------------------------------------------------------------------
create type public.expert_specialization as enum (
  'lawyer',
  'accountant',
  'marketer',
  'engineer',
  'builder',
  'consultant',
  'other'
);

create type public.expert_profile_status as enum (
  'draft',
  'moderation',
  'published',
  'archived'
);

create table public.expert_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  specialization public.expert_specialization not null default 'consultant',
  headline text not null default '',
  description text not null default '',
  experience_years integer not null default 0 check (experience_years >= 0),
  services text not null default '',
  region text not null default '',
  status public.expert_profile_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expert_profiles_user_id_idx on public.expert_profiles (user_id);
create index expert_profiles_status_idx on public.expert_profiles (status);
create index expert_profiles_specialization_idx on public.expert_profiles (specialization);
create index expert_profiles_region_idx on public.expert_profiles (region);

comment on table public.expert_profiles is 'Расширенные профили экспертов ЦКР';

create trigger expert_profiles_set_updated_at
before update on public.expert_profiles
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: expert_profiles
-- ---------------------------------------------------------------------------
alter table public.expert_profiles enable row level security;

create policy "expert_profiles_select_published_or_own"
on public.expert_profiles
for select
to anon, authenticated
using (
  status = 'published'
  or auth.uid() = user_id
  or public.is_admin(auth.uid())
);

create policy "expert_profiles_insert_own"
on public.expert_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "expert_profiles_update_own"
on public.expert_profiles
for update
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
)
with check (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);

create policy "expert_profiles_delete_own"
on public.expert_profiles
for delete
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);

-- ---------------------------------------------------------------------------
-- Helpers заявок: expert как target
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

  if p_target_type = 'expert' then
    return exists (
      select 1 from public.expert_profiles
      where id = p_target_id and user_id = auth.uid()
    );
  end if;

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

  if p_target_type = 'expert' then
    select user_id into owner from public.expert_profiles where id = p_target_id;
    return owner;
  end if;

  return null;
end;
$$;
