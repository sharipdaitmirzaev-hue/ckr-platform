-- ЦКР Этап 15: публичные профили и приватность

alter table public.profiles
  add column if not exists is_public boolean not null default true,
  add column if not exists show_contact boolean not null default false;

comment on column public.profiles.is_public is
  'Публичный профиль /profile/[id]; при false виден только владельцу и admin';
comment on column public.profiles.show_contact is
  'Показывать телефон на публичном профиле';

create index if not exists profiles_is_public_idx
  on public.profiles (is_public)
  where is_public = true;

-- Публичное чтение открытых незаблокированных профилей
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
on public.profiles
for select
to anon, authenticated
using (
  is_public = true
  and coalesce(is_blocked, false) = false
);

-- Роли публичного профиля (без admin)
drop policy if exists "user_roles_select_public_profile" on public.user_roles;
create policy "user_roles_select_public_profile"
on public.user_roles
for select
to anon, authenticated
using (
  role <> 'admin'
  and exists (
    select 1
    from public.profiles p
    where p.id = user_id
      and p.is_public = true
      and coalesce(p.is_blocked, false) = false
  )
);
