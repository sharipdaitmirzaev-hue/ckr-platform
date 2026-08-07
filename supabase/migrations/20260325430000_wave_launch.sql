-- ЦКР Этап 41: Wave Launch — волны запуска и участники

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.launch_wave_status as enum (
  'planned',
  'active',
  'completed'
);

create type public.launch_wave_type as enum (
  'internal',
  'closed',
  'public'
);

create type public.launch_wave_participant_status as enum (
  'invited',
  'joined',
  'active',
  'completed',
  'left'
);

-- ---------------------------------------------------------------------------
-- launch_waves
-- ---------------------------------------------------------------------------
create table public.launch_waves (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  status public.launch_wave_status not null default 'planned',
  wave_type public.launch_wave_type not null default 'closed',
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create index launch_waves_status_idx on public.launch_waves (status);
create index launch_waves_wave_type_idx on public.launch_waves (wave_type);

comment on table public.launch_waves is
  'Волны запуска ЦКР (internal / closed / public)';

-- ---------------------------------------------------------------------------
-- launch_wave_participants
-- ---------------------------------------------------------------------------
create table public.launch_wave_participants (
  id uuid primary key default gen_random_uuid(),
  wave_id uuid not null references public.launch_waves (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  status public.launch_wave_participant_status not null default 'invited',
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique (wave_id, user_id)
);

create index launch_wave_participants_wave_id_idx
  on public.launch_wave_participants (wave_id);
create index launch_wave_participants_user_id_idx
  on public.launch_wave_participants (user_id);
create index launch_wave_participants_status_idx
  on public.launch_wave_participants (status);

comment on table public.launch_wave_participants is
  'Участники волны запуска ЦКР';

-- ---------------------------------------------------------------------------
-- RLS (staff)
-- ---------------------------------------------------------------------------
alter table public.launch_waves enable row level security;
alter table public.launch_wave_participants enable row level security;

create policy "launch_waves_staff_all"
on public.launch_waves
for all
to authenticated
using (
  public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
)
with check (
  public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
);

create policy "launch_wave_participants_staff_all"
on public.launch_wave_participants
for all
to authenticated
using (
  public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
)
with check (
  public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
);

-- Участник видит свою запись
create policy "launch_wave_participants_select_own"
on public.launch_wave_participants
for select
to authenticated
using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Seed: три волны (идемпотентно)
-- ---------------------------------------------------------------------------
insert into public.launch_waves (
  id, name, description, status, wave_type, start_date, end_date
) values
(
  'c0000001-0000-4000-8000-000000000001',
  'Волна 0 — Internal',
  'Внутренний контур: команда и демо. Controlled beta / closed pilot.',
  'completed',
  'internal',
  '2026-03-01',
  '2026-03-20'
),
(
  'c0000001-0000-4000-8000-000000000002',
  'Волна 1 — Closed',
  'Расширенный closed launch после Conditional Go. Кейс ТИНДА — production pilot.',
  'active',
  'closed',
  '2026-03-21',
  null
),
(
  'c0000001-0000-4000-8000-000000000003',
  'Волна 2 — Public',
  'Ограниченный public / waitlist. Открывается после метрик волны 1.',
  'planned',
  'public',
  null,
  null
)
on conflict (id) do nothing;
