-- ЦКР Этап 20: закрытый beta-запуск — приглашения и обратная связь

-- ---------------------------------------------------------------------------
-- beta_invites
-- ---------------------------------------------------------------------------
create type public.beta_invite_status as enum (
  'created',
  'sent',
  'used',
  'expired'
);

create table public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null unique,
  role text not null default 'entrepreneur',
  status public.beta_invite_status not null default 'created',
  created_at timestamptz not null default now(),
  used_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  used_by uuid references public.profiles (id) on delete set null
);

create index beta_invites_email_idx on public.beta_invites (lower(email));
create index beta_invites_status_idx on public.beta_invites (status);
create index beta_invites_code_idx on public.beta_invites (code);

comment on table public.beta_invites is
  'Приглашения в закрытую beta ЦКР';

alter table public.beta_invites enable row level security;

drop policy if exists "beta_invites_admin_all" on public.beta_invites;
create policy "beta_invites_admin_all"
on public.beta_invites
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Аноним/auth могут проверить код при регистрации (только select по коду)
drop policy if exists "beta_invites_select_by_code" on public.beta_invites;
create policy "beta_invites_select_by_code"
on public.beta_invites
for select
to anon, authenticated
using (status in ('created', 'sent'));

-- Обновление used при регистрации — через authenticated + свой email match
-- (фактическую смену статуса делает server action с проверкой)
drop policy if exists "beta_invites_update_use" on public.beta_invites;
create policy "beta_invites_update_use"
on public.beta_invites
for update
to authenticated
using (status in ('created', 'sent'))
with check (status = 'used');

-- ---------------------------------------------------------------------------
-- feedback
-- ---------------------------------------------------------------------------
create type public.feedback_type as enum (
  'bug',
  'idea',
  'question',
  'review'
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  type public.feedback_type not null default 'idea',
  message text not null,
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  page text not null default '',
  created_at timestamptz not null default now()
);

create index feedback_user_id_idx on public.feedback (user_id);
create index feedback_type_idx on public.feedback (type);
create index feedback_created_at_idx on public.feedback (created_at desc);

comment on table public.feedback is
  'Обратная связь beta-пользователей ЦКР';

alter table public.feedback enable row level security;

drop policy if exists "feedback_insert_own_or_anon" on public.feedback;
create policy "feedback_insert_own_or_anon"
on public.feedback
for insert
to anon, authenticated
with check (
  user_id is null
  or auth.uid() = user_id
);

drop policy if exists "feedback_select_own_or_admin" on public.feedback;
create policy "feedback_select_own_or_admin"
on public.feedback
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);

-- ---------------------------------------------------------------------------
-- user_feedback_events — оценка ключевых сценариев
-- ---------------------------------------------------------------------------
create table public.user_feedback_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index user_feedback_events_user_id_idx
  on public.user_feedback_events (user_id);
create index user_feedback_events_event_type_idx
  on public.user_feedback_events (event_type);
create index user_feedback_events_created_at_idx
  on public.user_feedback_events (created_at desc);

comment on table public.user_feedback_events is
  'Оценки после ключевых действий beta (проект, заявка, возможность, инвестиция)';

alter table public.user_feedback_events enable row level security;

drop policy if exists "user_feedback_events_insert" on public.user_feedback_events;
create policy "user_feedback_events_insert"
on public.user_feedback_events
for insert
to authenticated
with check (
  user_id is null
  or auth.uid() = user_id
);

drop policy if exists "user_feedback_events_select" on public.user_feedback_events;
create policy "user_feedback_events_select"
on public.user_feedback_events
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);
