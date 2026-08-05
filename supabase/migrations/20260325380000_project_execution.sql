-- ЦКР Этап 33: Project Execution — дорожные карты, KPI, связь с tasks/milestones

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.roadmap_status as enum (
  'draft',
  'active',
  'completed',
  'archived'
);

create type public.roadmap_item_status as enum (
  'planned',
  'in_progress',
  'blocked',
  'completed',
  'cancelled'
);

alter type public.task_related_type add value if not exists 'roadmap_item';

alter type public.project_activity_type add value if not exists 'roadmap_created';
alter type public.project_activity_type add value if not exists 'roadmap_item_completed';
alter type public.project_activity_type add value if not exists 'metric_updated';
alter type public.project_activity_type add value if not exists 'project_progress_checked';

-- ---------------------------------------------------------------------------
-- project_roadmaps
-- ---------------------------------------------------------------------------
create table public.project_roadmaps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text not null default '',
  status public.roadmap_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_roadmaps_project_id_idx
  on public.project_roadmaps (project_id);
create index project_roadmaps_status_idx
  on public.project_roadmaps (status);

comment on table public.project_roadmaps is
  'Рабочие дорожные карты реализации проектов ЦКР';

create trigger project_roadmaps_set_updated_at
before update on public.project_roadmaps
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- roadmap_items
-- ---------------------------------------------------------------------------
create table public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.project_roadmaps (id) on delete cascade,
  title text not null,
  description text not null default '',
  order_number integer not null default 0,
  responsible_user_id uuid references public.profiles (id) on delete set null,
  deadline timestamptz,
  status public.roadmap_item_status not null default 'planned',
  milestone_id uuid references public.project_milestones (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index roadmap_items_roadmap_id_idx
  on public.roadmap_items (roadmap_id);
create index roadmap_items_status_idx
  on public.roadmap_items (status);
create index roadmap_items_order_idx
  on public.roadmap_items (roadmap_id, order_number);
create index roadmap_items_milestone_id_idx
  on public.roadmap_items (milestone_id);
create index roadmap_items_responsible_idx
  on public.roadmap_items (responsible_user_id);

comment on table public.roadmap_items is
  'Этапы дорожной карты: задачи, ответственный, срок, прогресс';

create trigger roadmap_items_set_updated_at
before update on public.roadmap_items
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- project_metrics (KPI)
-- ---------------------------------------------------------------------------
create table public.project_metrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  description text not null default '',
  target_value numeric(18, 2) not null default 0,
  current_value numeric(18, 2) not null default 0,
  unit text not null default '',
  period text not null default 'quarter',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_metrics_project_id_idx
  on public.project_metrics (project_id);

comment on table public.project_metrics is
  'KPI проекта ЦКР: целевые и текущие значения';

create trigger project_metrics_set_updated_at
before update on public.project_metrics
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Связь tasks ↔ roadmap_items
-- ---------------------------------------------------------------------------
alter table public.tasks
  add column if not exists roadmap_item_id uuid
    references public.roadmap_items (id) on delete set null;

create index if not exists tasks_roadmap_item_id_idx
  on public.tasks (roadmap_item_id);

comment on column public.tasks.roadmap_item_id is
  'Связь задачи операционного контура с этапом дорожной карты проекта';

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.roadmap_project_id(p_roadmap_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select project_id from public.project_roadmaps where id = p_roadmap_id;
$$;

create or replace function public.roadmap_item_project_id(p_item_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select r.project_id
  from public.roadmap_items i
  join public.project_roadmaps r on r.id = i.roadmap_id
  where i.id = p_item_id;
$$;

-- ---------------------------------------------------------------------------
-- RLS: project_roadmaps
-- ---------------------------------------------------------------------------
alter table public.project_roadmaps enable row level security;

create policy "project_roadmaps_select_members"
on public.project_roadmaps
for select
to authenticated
using (
  public.is_project_workspace_member(project_id)
  or public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
);

create policy "project_roadmaps_insert_owner"
on public.project_roadmaps
for insert
to authenticated
with check (
  public.is_project_owner(project_id)
  or public.is_admin(auth.uid())
);

create policy "project_roadmaps_update_owner"
on public.project_roadmaps
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

create policy "project_roadmaps_delete_owner"
on public.project_roadmaps
for delete
to authenticated
using (
  public.is_project_owner(project_id)
  or public.is_admin(auth.uid())
);

-- ---------------------------------------------------------------------------
-- RLS: roadmap_items
-- ---------------------------------------------------------------------------
alter table public.roadmap_items enable row level security;

create policy "roadmap_items_select_members"
on public.roadmap_items
for select
to authenticated
using (
  public.is_project_workspace_member(public.roadmap_project_id(roadmap_id))
  or public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
);

create policy "roadmap_items_insert_owner"
on public.roadmap_items
for insert
to authenticated
with check (
  public.is_project_owner(public.roadmap_project_id(roadmap_id))
  or public.is_admin(auth.uid())
);

create policy "roadmap_items_update_owner"
on public.roadmap_items
for update
to authenticated
using (
  public.is_project_owner(public.roadmap_project_id(roadmap_id))
  or public.is_admin(auth.uid())
)
with check (
  public.is_project_owner(public.roadmap_project_id(roadmap_id))
  or public.is_admin(auth.uid())
);

create policy "roadmap_items_delete_owner"
on public.roadmap_items
for delete
to authenticated
using (
  public.is_project_owner(public.roadmap_project_id(roadmap_id))
  or public.is_admin(auth.uid())
);

-- ---------------------------------------------------------------------------
-- RLS: project_metrics
-- ---------------------------------------------------------------------------
alter table public.project_metrics enable row level security;

create policy "project_metrics_select_members"
on public.project_metrics
for select
to authenticated
using (
  public.is_project_workspace_member(project_id)
  or public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
);

create policy "project_metrics_insert_owner"
on public.project_metrics
for insert
to authenticated
with check (
  public.is_project_owner(project_id)
  or public.is_admin(auth.uid())
);

create policy "project_metrics_update_owner"
on public.project_metrics
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

create policy "project_metrics_delete_owner"
on public.project_metrics
for delete
to authenticated
using (
  public.is_project_owner(project_id)
  or public.is_admin(auth.uid())
);

-- ---------------------------------------------------------------------------
-- RLS: tasks — доступ участникам проекта по roadmap_item / related project
-- ---------------------------------------------------------------------------
create policy "tasks_project_select_via_roadmap"
on public.tasks
for select
to authenticated
using (
  (
    roadmap_item_id is not null
    and public.is_project_workspace_member(
      public.roadmap_item_project_id(roadmap_item_id)
    )
  )
  or (
    related_type = 'project'
    and related_id is not null
    and public.is_project_workspace_member(related_id)
  )
);

create policy "tasks_project_insert_via_roadmap"
on public.tasks
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
  or (
    roadmap_item_id is not null
    and public.is_project_owner(
      public.roadmap_item_project_id(roadmap_item_id)
    )
  )
  or (
    related_type = 'project'
    and related_id is not null
    and public.is_project_owner(related_id)
  )
);

create policy "tasks_project_update_via_roadmap"
on public.tasks
for update
to authenticated
using (
  public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
  or (
    roadmap_item_id is not null
    and public.is_project_owner(
      public.roadmap_item_project_id(roadmap_item_id)
    )
  )
  or (
    related_type = 'project'
    and related_id is not null
    and public.is_project_owner(related_id)
  )
)
with check (
  public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
  or (
    roadmap_item_id is not null
    and public.is_project_owner(
      public.roadmap_item_project_id(roadmap_item_id)
    )
  )
  or (
    related_type = 'project'
    and related_id is not null
    and public.is_project_owner(related_id)
  )
);
