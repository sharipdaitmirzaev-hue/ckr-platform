-- ЦКР Этап 60: Growth Engine — задачи роста (без новых крупных модулей)

create type public.growth_task_type as enum (
  'find_partner',
  'invite_experts',
  'attract_projects',
  'prepare_event',
  'create_content'
);

create type public.growth_task_status as enum (
  'new',
  'in_progress',
  'completed'
);

create table public.growth_tasks (
  id uuid primary key default gen_random_uuid(),
  task_type public.growth_task_type not null,
  title text not null,
  description text not null default '',
  status public.growth_task_status not null default 'new',
  assignee_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index growth_tasks_status_idx on public.growth_tasks (status);
create index growth_tasks_created_at_idx on public.growth_tasks (created_at desc);

comment on table public.growth_tasks is
  'Операционные задачи роста ЦКР после Public Launch (этап 60)';

alter table public.growth_tasks enable row level security;

create policy "growth_tasks_staff_all"
on public.growth_tasks
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

-- Seed стартовых задач роста (идемпотентно по title)
insert into public.growth_tasks (id, task_type, title, description, status)
values
(
  'c000000c-0000-4000-8000-000000000001',
  'find_partner',
  'Найти ключевого партнёра',
  'Организация / канал для привлечения пользователей.',
  'new'
),
(
  'c000000c-0000-4000-8000-000000000002',
  'invite_experts',
  'Пригласить экспертов',
  'Набор экспертов через invites и CRM.',
  'new'
),
(
  'c000000c-0000-4000-8000-000000000003',
  'attract_projects',
  'Привлечь проекты',
  'CRM pipeline: контакт → карточка → публикация.',
  'new'
),
(
  'c000000c-0000-4000-8000-000000000004',
  'prepare_event',
  'Подготовить мероприятие',
  'Канал events для роста аудитории.',
  'new'
),
(
  'c000000c-0000-4000-8000-000000000005',
  'create_content',
  'Создать контент',
  'Материалы для канала content / соцсетей.',
  'new'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  task_type = excluded.task_type;
