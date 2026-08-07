-- ЦКР Этап 28: closed pilot — application→deal + investor_interests

-- ---------------------------------------------------------------------------
-- deals.application_id
-- ---------------------------------------------------------------------------
alter table public.deals
  add column if not exists application_id uuid
    references public.applications (id) on delete set null;

create index if not exists deals_application_id_idx
  on public.deals (application_id)
  where application_id is not null;

-- Одна принятая заявка → не более одной сделки
create unique index if not exists deals_application_id_uidx
  on public.deals (application_id)
  where application_id is not null;

comment on column public.deals.application_id is
  'Связь сделки с принятой заявкой (closed pilot)';

-- ---------------------------------------------------------------------------
-- investor_interests
-- ---------------------------------------------------------------------------
create type public.investor_interest_target_type as enum (
  'project',
  'opportunity',
  'investment'
);

create table public.investor_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.investor_interest_target_type not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index investor_interests_user_idx
  on public.investor_interests (user_id, created_at desc);
create index investor_interests_target_idx
  on public.investor_interests (target_type, target_id);

comment on table public.investor_interests is
  'Интересы инвестора: project / opportunity / investment';

alter table public.investor_interests enable row level security;

drop policy if exists "investor_interests_select_own" on public.investor_interests;
create policy "investor_interests_select_own"
on public.investor_interests
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
);

drop policy if exists "investor_interests_insert_own" on public.investor_interests;
create policy "investor_interests_insert_own"
on public.investor_interests
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "investor_interests_delete_own" on public.investor_interests;
create policy "investor_interests_delete_own"
on public.investor_interests
for delete
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);
