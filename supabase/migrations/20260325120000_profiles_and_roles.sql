-- ЦКР Этап 1: profiles + user_roles + RLS + auto profile on signup

-- ---------------------------------------------------------------------------
-- Enum ролей
-- ---------------------------------------------------------------------------
create type public.user_role as enum (
  'entrepreneur',
  'investor',
  'expert',
  'company',
  'admin'
);

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  company_name text,
  avatar_url text,
  bio text,
  phone text,
  city text,
  region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_region_idx on public.profiles (region);
create index profiles_city_idx on public.profiles (city);

comment on table public.profiles is 'Профиль пользователя ЦКР (1:1 с auth.users)';

-- ---------------------------------------------------------------------------
-- user_roles (мультироль)
-- ---------------------------------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index user_roles_user_id_idx on public.user_roles (user_id);
create index user_roles_role_idx on public.user_roles (role);

comment on table public.user_roles is 'Роли пользователя; один пользователь может иметь несколько ролей';

-- ---------------------------------------------------------------------------
-- updated_at trigger for profiles
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile after auth.users insert
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helpers for RLS
-- ---------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = uid
      and role = 'admin'
  );
$$;

create or replace function public.has_role(uid uuid, check_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = uid
      and role = check_role
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS: profiles
-- Пользователь видит и редактирует только свой профиль.
-- Публичное чтение профилей — позже.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_admin(auth.uid()))
with check (auth.uid() = id or public.is_admin(auth.uid()));

-- Insert выполняется security definer trigger'ом; прямых insert от клиента нет.
-- На всякий случай запрещаем insert через API для authenticated/anon.

-- ---------------------------------------------------------------------------
-- RLS: user_roles
-- Пользователь читает свои роли.
-- Может назначать себе роли, кроме admin.
-- ---------------------------------------------------------------------------
alter table public.user_roles enable row level security;

create policy "user_roles_select_own"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "user_roles_insert_own_non_admin"
on public.user_roles
for insert
to authenticated
with check (
  auth.uid() = user_id
  and role <> 'admin'
);

create policy "user_roles_delete_own_non_admin"
on public.user_roles
for delete
to authenticated
using (
  auth.uid() = user_id
  and role <> 'admin'
);

-- Admin management (optional foundation)
create policy "user_roles_admin_all"
on public.user_roles
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
