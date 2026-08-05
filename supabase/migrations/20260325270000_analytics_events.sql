-- ЦКР Этап 17: события аналитики для управления платформой

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_created_at_idx
  on public.analytics_events (created_at desc);
create index analytics_events_event_type_idx
  on public.analytics_events (event_type);
create index analytics_events_user_id_idx
  on public.analytics_events (user_id)
  where user_id is not null;
create index analytics_events_entity_idx
  on public.analytics_events (entity_type, entity_id)
  where entity_id is not null;

comment on table public.analytics_events is
  'События аналитики ЦКР: регистрации, просмотры, заявки, сделки и проверки';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.analytics_events enable row level security;

-- Запись: свой user_id или анонимный просмотр (user_id is null)
drop policy if exists "analytics_events_insert" on public.analytics_events;
create policy "analytics_events_insert"
on public.analytics_events
for insert
to anon, authenticated
with check (
  user_id is null
  or auth.uid() = user_id
);

-- Чтение: admin — всё; пользователь — свои события и события своих проектов
drop policy if exists "analytics_events_select" on public.analytics_events;
create policy "analytics_events_select"
on public.analytics_events
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or user_id = auth.uid()
  or (
    entity_type = 'project'
    and entity_id is not null
    and exists (
      select 1
      from public.projects p
      where p.id = entity_id
        and p.owner_id = auth.uid()
    )
  )
);
