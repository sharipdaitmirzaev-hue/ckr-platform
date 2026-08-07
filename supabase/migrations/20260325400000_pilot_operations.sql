-- ЦКР Этап 36: Pilot Operations — участники, чеклисты, feedback categories/priority

-- ---------------------------------------------------------------------------
-- Enums: pilot participants
-- ---------------------------------------------------------------------------
create type public.pilot_participant_role as enum (
  'entrepreneur',
  'investor',
  'expert',
  'organization',
  'operator'
);

create type public.pilot_participant_status as enum (
  'invited',
  'active',
  'inactive',
  'completed'
);

create type public.pilot_checklist_status as enum (
  'pending',
  'done',
  'skipped'
);

create type public.feedback_priority as enum (
  'low',
  'medium',
  'high',
  'critical'
);

-- Расширение категорий feedback (совместимо с существующими)
alter type public.feedback_type add value if not exists 'ux';
alter type public.feedback_type add value if not exists 'business_value';
alter type public.feedback_type add value if not exists 'lia_quality';

-- ---------------------------------------------------------------------------
-- pilot_participants
-- ---------------------------------------------------------------------------
create table public.pilot_participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  role public.pilot_participant_role not null default 'entrepreneur',
  status public.pilot_participant_status not null default 'invited',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pilot_participants_user_id_idx
  on public.pilot_participants (user_id);
create index pilot_participants_status_idx
  on public.pilot_participants (status);
create index pilot_participants_role_idx
  on public.pilot_participants (role);

comment on table public.pilot_participants is
  'Участники закрытого пилота ЦКР';

create trigger pilot_participants_set_updated_at
before update on public.pilot_participants
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- pilot_checklists
-- ---------------------------------------------------------------------------
create table public.pilot_checklists (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.pilot_participants (id) on delete cascade,
  item text not null,
  status public.pilot_checklist_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pilot_checklists_participant_id_idx
  on public.pilot_checklists (participant_id);
create index pilot_checklists_status_idx
  on public.pilot_checklists (status);

comment on table public.pilot_checklists is
  'Чеклист прохождения пилота для участника';

create trigger pilot_checklists_set_updated_at
before update on public.pilot_checklists
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- feedback: priority
-- ---------------------------------------------------------------------------
alter table public.feedback
  add column if not exists priority public.feedback_priority not null default 'medium';

create index if not exists feedback_priority_idx
  on public.feedback (priority);

comment on column public.feedback.priority is
  'Приоритет обратной связи пилота';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.pilot_participants enable row level security;
alter table public.pilot_checklists enable row level security;

create policy "pilot_participants_staff_all"
on public.pilot_participants
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

create policy "pilot_participants_select_self"
on public.pilot_participants
for select
to authenticated
using (user_id = auth.uid());

create policy "pilot_checklists_staff_all"
on public.pilot_checklists
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

create policy "pilot_checklists_select_self"
on public.pilot_checklists
for select
to authenticated
using (
  exists (
    select 1
    from public.pilot_participants p
    where p.id = participant_id
      and p.user_id = auth.uid()
  )
);
