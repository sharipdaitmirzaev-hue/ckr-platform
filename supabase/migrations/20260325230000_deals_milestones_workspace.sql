-- ЦКР Этап 13: сделки, участники, этапы реализации, история проекта

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.deal_type as enum (
  'investment',
  'partnership',
  'service',
  'purchase',
  'lease',
  'other'
);

create type public.deal_status as enum (
  'draft',
  'negotiation',
  'agreement',
  'active',
  'completed',
  'cancelled'
);

create type public.deal_participant_role as enum (
  'owner',
  'investor',
  'partner',
  'expert'
);

create type public.milestone_status as enum (
  'planned',
  'in_progress',
  'completed',
  'blocked'
);

create type public.project_activity_type as enum (
  'status_change',
  'participant_added',
  'document_uploaded',
  'milestone_completed',
  'milestone_created',
  'milestone_updated',
  'deal_created',
  'deal_updated',
  'note'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  initiator_id uuid not null references public.profiles (id) on delete cascade,
  partner_id uuid references public.profiles (id) on delete set null,
  deal_type public.deal_type not null default 'other',
  amount numeric(18, 2),
  currency text not null default 'RUB',
  status public.deal_status not null default 'draft',
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deals_project_id_idx on public.deals (project_id);
create index deals_initiator_id_idx on public.deals (initiator_id);
create index deals_partner_id_idx on public.deals (partner_id);
create index deals_status_idx on public.deals (status);

comment on table public.deals is 'Сделки ЦКР: переход от решения к реализации проекта';

create trigger deals_set_updated_at
before update on public.deals
for each row
execute function public.set_updated_at();

create table public.deal_participants (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.deal_participant_role not null default 'partner',
  created_at timestamptz not null default now(),
  unique (deal_id, user_id)
);

create index deal_participants_deal_id_idx on public.deal_participants (deal_id);
create index deal_participants_user_id_idx on public.deal_participants (user_id);

comment on table public.deal_participants is 'Участники сделки: owner / investor / partner / expert';

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text not null default '',
  status public.milestone_status not null default 'planned',
  deadline date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_milestones_project_id_idx on public.project_milestones (project_id);
create index project_milestones_status_idx on public.project_milestones (status);

comment on table public.project_milestones is 'Этапы реализации проекта';

create trigger project_milestones_set_updated_at
before update on public.project_milestones
for each row
execute function public.set_updated_at();

create table public.project_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  activity_type public.project_activity_type not null default 'note',
  title text not null,
  body text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index project_activity_project_id_idx on public.project_activity (project_id);
create index project_activity_created_at_idx on public.project_activity (created_at desc);

comment on table public.project_activity is
  'История проекта: статусы, участники, документы, этапы';

-- ---------------------------------------------------------------------------
-- Helpers (после таблиц)
-- ---------------------------------------------------------------------------
create or replace function public.is_project_owner(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects
    where id = p_project_id
      and owner_id = auth.uid()
  );
$$;

create or replace function public.is_project_workspace_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_project_owner(p_project_id)
    or public.is_admin(auth.uid())
    or exists (
      select 1
      from public.deals d
      where d.project_id = p_project_id
        and (
          d.initiator_id = auth.uid()
          or d.partner_id = auth.uid()
        )
    )
    or exists (
      select 1
      from public.deal_participants dp
      join public.deals d on d.id = dp.deal_id
      where d.project_id = p_project_id
        and dp.user_id = auth.uid()
    );
$$;

create or replace function public.is_deal_participant(p_deal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin(auth.uid())
    or exists (
      select 1
      from public.deals d
      where d.id = p_deal_id
        and (
          d.initiator_id = auth.uid()
          or d.partner_id = auth.uid()
          or public.is_project_owner(d.project_id)
        )
    )
    or exists (
      select 1
      from public.deal_participants dp
      where dp.deal_id = p_deal_id
        and dp.user_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.deals enable row level security;
alter table public.deal_participants enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_activity enable row level security;

create policy "deals_select_members"
on public.deals
for select
to authenticated
using (
  public.is_deal_participant(id)
  or public.is_project_workspace_member(project_id)
);

create policy "deals_insert_owner_or_initiator"
on public.deals
for insert
to authenticated
with check (
  auth.uid() = initiator_id
  and (
    public.is_project_owner(project_id)
    or public.is_admin(auth.uid())
  )
);

create policy "deals_update_members"
on public.deals
for update
to authenticated
using (
  public.is_project_owner(project_id)
  or initiator_id = auth.uid()
  or public.is_admin(auth.uid())
)
with check (
  public.is_project_owner(project_id)
  or initiator_id = auth.uid()
  or public.is_admin(auth.uid())
);

create policy "deals_delete_owner"
on public.deals
for delete
to authenticated
using (
  public.is_project_owner(project_id)
  or public.is_admin(auth.uid())
);

create policy "deal_participants_select_members"
on public.deal_participants
for select
to authenticated
using (public.is_deal_participant(deal_id));

create policy "deal_participants_insert_members"
on public.deal_participants
for insert
to authenticated
with check (
  exists (
    select 1 from public.deals d
    where d.id = deal_id
      and (
        public.is_project_owner(d.project_id)
        or d.initiator_id = auth.uid()
        or public.is_admin(auth.uid())
      )
  )
);

create policy "deal_participants_delete_owner"
on public.deal_participants
for delete
to authenticated
using (
  exists (
    select 1 from public.deals d
    where d.id = deal_id
      and (
        public.is_project_owner(d.project_id)
        or d.initiator_id = auth.uid()
        or public.is_admin(auth.uid())
      )
  )
);

create policy "milestones_select_members"
on public.project_milestones
for select
to authenticated
using (public.is_project_workspace_member(project_id));

create policy "milestones_insert_owner"
on public.project_milestones
for insert
to authenticated
with check (
  public.is_project_owner(project_id)
  or public.is_admin(auth.uid())
);

create policy "milestones_update_owner"
on public.project_milestones
for update
to authenticated
using (
  public.is_project_owner(project_id)
  or public.is_admin(auth.uid())
)
with check (
  public.is_project_owner(project_id)
  or public.is_admin(auth.uid())
);

create policy "milestones_delete_owner"
on public.project_milestones
for delete
to authenticated
using (
  public.is_project_owner(project_id)
  or public.is_admin(auth.uid())
);

create policy "activity_select_members"
on public.project_activity
for select
to authenticated
using (public.is_project_workspace_member(project_id));

create policy "activity_insert_members"
on public.project_activity
for insert
to authenticated
with check (
  public.is_project_workspace_member(project_id)
  and (actor_id is null or actor_id = auth.uid())
);
