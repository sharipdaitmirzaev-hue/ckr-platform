-- ЦКР Этап 59: Public Launch Operations — активация, задачи, источник public_launch

-- ---------------------------------------------------------------------------
-- Журнал активаций Public Launch Wave
-- ---------------------------------------------------------------------------
create table public.public_launch_activations (
  id uuid primary key default gen_random_uuid(),
  wave_id uuid references public.launch_waves (id) on delete set null,
  decision_id uuid references public.public_launch_decisions (id) on delete set null,
  start_date date not null default current_date,
  comment text not null default '',
  responsible_id uuid references public.profiles (id) on delete set null,
  activated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index public_launch_activations_wave_id_idx
  on public.public_launch_activations (wave_id);
create index public_launch_activations_created_at_idx
  on public.public_launch_activations (created_at desc);

comment on table public.public_launch_activations is
  'Фиксация активации Public Launch Wave (дата, ответственный, комментарий)';

alter table public.public_launch_activations enable row level security;

create policy "public_launch_activations_staff_all"
on public.public_launch_activations
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

-- ---------------------------------------------------------------------------
-- Операционные задачи запуска
-- ---------------------------------------------------------------------------
create type public.launch_ops_task_type as enum (
  'check_project',
  'check_expert',
  'reply_user',
  'handle_issue',
  'contact_partner'
);

create type public.launch_ops_task_status as enum (
  'new',
  'in_progress',
  'completed'
);

create table public.launch_operations_tasks (
  id uuid primary key default gen_random_uuid(),
  wave_id uuid references public.launch_waves (id) on delete set null,
  task_type public.launch_ops_task_type not null,
  title text not null,
  description text not null default '',
  status public.launch_ops_task_status not null default 'new',
  assignee_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index launch_operations_tasks_wave_id_idx
  on public.launch_operations_tasks (wave_id);
create index launch_operations_tasks_status_idx
  on public.launch_operations_tasks (status);

comment on table public.launch_operations_tasks is
  'Операционные задачи команды после Public Launch (этап 59)';

alter table public.launch_operations_tasks enable row level security;

create policy "launch_operations_tasks_staff_all"
on public.launch_operations_tasks
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

-- ---------------------------------------------------------------------------
-- Источник public_launch для product_improvements / pilot_issues
-- ---------------------------------------------------------------------------
alter type public.product_improvement_source add value if not exists 'public_launch';

comment on column public.pilot_issues.source_type is
  'Источник: feedback | analytics | lia | public_launch | manual | ...';

comment on column public.feedback.category is
  'Категория: public_launch | UX | Lia | Project | Expert | Investment | Other';
