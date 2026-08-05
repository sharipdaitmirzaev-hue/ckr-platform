-- ЦКР Этап 34: Project Outcomes — результаты и эффективность сопровождения

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.project_result_type as enum (
  'revenue',
  'investment',
  'partnership',
  'launch',
  'growth',
  'cost_reduction',
  'other'
);

create type public.project_financial_metric_type as enum (
  'revenue',
  'investment',
  'expenses',
  'profit',
  'valuation'
);

alter type public.project_activity_type add value if not exists 'result_created';
alter type public.project_activity_type add value if not exists 'financial_metric_updated';
alter type public.project_activity_type add value if not exists 'project_completed';
alter type public.project_activity_type add value if not exists 'outcome_generated';

-- ---------------------------------------------------------------------------
-- project_results
-- ---------------------------------------------------------------------------
create table public.project_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  result_type public.project_result_type not null default 'other',
  title text not null,
  description text not null default '',
  value numeric(18, 2),
  unit text not null default '',
  achieved_at timestamptz,
  metric_id uuid references public.project_metrics (id) on delete set null,
  created_at timestamptz not null default now()
);

create index project_results_project_id_idx
  on public.project_results (project_id);
create index project_results_type_idx
  on public.project_results (result_type);
create index project_results_metric_id_idx
  on public.project_results (metric_id);
create index project_results_achieved_at_idx
  on public.project_results (achieved_at);

comment on table public.project_results is
  'Фактические результаты проектов ЦКР (связь с KPI через metric_id)';

-- ---------------------------------------------------------------------------
-- project_financial_metrics
-- ---------------------------------------------------------------------------
create table public.project_financial_metrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  metric_type public.project_financial_metric_type not null,
  value numeric(18, 2) not null default 0,
  currency text not null default 'RUB',
  period text not null default 'year',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_financial_metrics_project_id_idx
  on public.project_financial_metrics (project_id);
create index project_financial_metrics_type_idx
  on public.project_financial_metrics (metric_type);

comment on table public.project_financial_metrics is
  'Финансовые показатели проектов ЦКР';

create trigger project_financial_metrics_set_updated_at
before update on public.project_financial_metrics
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.project_results enable row level security;
alter table public.project_financial_metrics enable row level security;

create policy "project_results_select_members"
on public.project_results
for select
to authenticated
using (
  public.is_project_workspace_member(project_id)
  or public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
);

create policy "project_results_insert_owner"
on public.project_results
for insert
to authenticated
with check (
  public.is_project_owner(project_id)
  or public.is_admin(auth.uid())
);

create policy "project_results_update_owner"
on public.project_results
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

create policy "project_results_delete_owner"
on public.project_results
for delete
to authenticated
using (
  public.is_project_owner(project_id)
  or public.is_admin(auth.uid())
);

create policy "project_financial_metrics_select_members"
on public.project_financial_metrics
for select
to authenticated
using (
  public.is_project_workspace_member(project_id)
  or public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
);

create policy "project_financial_metrics_insert_owner"
on public.project_financial_metrics
for insert
to authenticated
with check (
  public.is_project_owner(project_id)
  or public.is_admin(auth.uid())
);

create policy "project_financial_metrics_update_owner"
on public.project_financial_metrics
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

create policy "project_financial_metrics_delete_owner"
on public.project_financial_metrics
for delete
to authenticated
using (
  public.is_project_owner(project_id)
  or public.is_admin(auth.uid())
);
