-- ЦКР Этап 8: административная панель — блокировка пользователей + RLS уточнения

-- ---------------------------------------------------------------------------
-- profiles.is_blocked
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_blocked boolean not null default false;

comment on column public.profiles.is_blocked is 'Блокировка участника администратором ЦКР';

create index if not exists profiles_is_blocked_idx on public.profiles (is_blocked);

-- ---------------------------------------------------------------------------
-- Helper: текущий пользователь заблокирован?
-- ---------------------------------------------------------------------------
create or replace function public.is_blocked(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select is_blocked
      from public.profiles
      where id = uid
    ),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Admin может читать все документы на проверке (уже есть is_admin в select)
-- Дополнительно: admin select всех applications для статистики
-- (политики applications уже допускают is_admin)
-- ---------------------------------------------------------------------------

-- Явная политика admin update verification_status уже покрыта update own/admin
-- на projects / opportunities / investment_offers / expert_profiles.

-- Разрешаем admin читать email через view? Email в auth.users — недоступен из client.
-- В админке показываем full_name / company / phone из profiles.
