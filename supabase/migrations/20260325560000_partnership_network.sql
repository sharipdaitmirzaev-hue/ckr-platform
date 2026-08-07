-- ЦКР Этап 62: Partnership Network — pipeline + задачи (без новой системы партнёров)

create type public.partnership_pipeline_stage as enum (
  'partner_found',
  'contacted',
  'meeting',
  'negotiation',
  'active',
  'completed'
);

alter table public.partnerships
  add column if not exists pipeline_stage public.partnership_pipeline_stage
    not null default 'partner_found',
  add column if not exists assignee_id uuid references public.profiles (id) on delete set null,
  add column if not exists started_at timestamptz;

update public.partnerships
set pipeline_stage = case
  when status = 'active' then 'active'::public.partnership_pipeline_stage
  when status = 'inactive' then 'completed'::public.partnership_pipeline_stage
  else 'partner_found'::public.partnership_pipeline_stage
end
where true;

update public.partnerships
set started_at = created_at
where started_at is null;

create index if not exists partnerships_pipeline_stage_idx
  on public.partnerships (pipeline_stage);

comment on column public.partnerships.pipeline_stage is
  'PartnershipPipeline этап (этап 62)';

create type public.partnership_task_type as enum (
  'find_contact',
  'hold_meeting',
  'prepare_offer',
  'sign_agreement',
  'support_partner'
);

create type public.partnership_task_status as enum (
  'new',
  'in_progress',
  'completed'
);

create table if not exists public.partnership_tasks (
  id uuid primary key default gen_random_uuid(),
  task_type public.partnership_task_type not null,
  title text not null,
  description text not null default '',
  status public.partnership_task_status not null default 'new',
  organization_id uuid references public.organizations (id) on delete set null,
  partnership_id uuid references public.partnerships (id) on delete set null,
  assignee_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists partnership_tasks_status_idx
  on public.partnership_tasks (status);
create index if not exists partnership_tasks_created_at_idx
  on public.partnership_tasks (created_at desc);

comment on table public.partnership_tasks is
  'Операционные задачи Partnership Network (этап 62)';

alter table public.partnership_tasks enable row level security;

drop policy if exists "partnership_tasks_staff_all" on public.partnership_tasks;
create policy "partnership_tasks_staff_all"
on public.partnership_tasks
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

insert into public.partnership_tasks (id, task_type, title, description, status)
values
(
  'd000000d-0000-4000-8000-000000000001',
  'find_contact',
  'Найти контакт в целевой организации',
  'Банк / ТПП / ассоциация / университет.',
  'new'
),
(
  'd000000d-0000-4000-8000-000000000002',
  'hold_meeting',
  'Провести первую встречу',
  'Знакомство с ЦКР и обсуждение формата партнёрства.',
  'new'
),
(
  'd000000d-0000-4000-8000-000000000003',
  'prepare_offer',
  'Подготовить партнёрское предложение',
  'Ценность для партнёра и механика referrals.',
  'new'
),
(
  'd000000d-0000-4000-8000-000000000004',
  'sign_agreement',
  'Зафиксировать соглашение',
  'Перевод в active + attribution source=partner.',
  'new'
),
(
  'd000000d-0000-4000-8000-000000000005',
  'support_partner',
  'Сопровождать активного партнёра',
  'Проекты, пользователи, результаты.',
  'new'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  task_type = excluded.task_type;
