-- ЦКР Этап 22: Операционный центр — задачи, роли операторов, SLA

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.operator_role as enum (
  'manager',
  'analyst',
  'moderator',
  'admin'
);

create type public.task_status as enum (
  'new',
  'in_progress',
  'waiting',
  'completed',
  'cancelled'
);

create type public.task_priority as enum (
  'low',
  'medium',
  'high',
  'urgent'
);

create type public.task_related_type as enum (
  'lead',
  'project',
  'deal',
  'document',
  'verification'
);

-- ---------------------------------------------------------------------------
-- operator_roles
-- ---------------------------------------------------------------------------
create table public.operator_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.operator_role not null default 'analyst',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role)
);

create index operator_roles_user_id_idx on public.operator_roles (user_id);
create index operator_roles_active_idx on public.operator_roles (active);

comment on table public.operator_roles is
  'Роли сотрудников операционного центра ЦКР';

create trigger operator_roles_set_updated_at
before update on public.operator_roles
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper: is_operator (platform admin или запись в operator_roles)
-- ---------------------------------------------------------------------------
create or replace function public.is_operator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin(uid)
    or exists (
      select 1
      from public.operator_roles oroles
      where oroles.user_id = uid
        and oroles.active = true
    );
$$;

comment on function public.is_operator(uuid) is
  'Оператор ЦКР: роль admin платформы или активная operator_roles';

alter table public.operator_roles enable row level security;

drop policy if exists "operator_roles_admin_all" on public.operator_roles;
create policy "operator_roles_admin_all"
on public.operator_roles
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "operator_roles_select_self_or_operator" on public.operator_roles;
create policy "operator_roles_select_self_or_operator"
on public.operator_roles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_operator(auth.uid())
);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  assigned_to uuid references public.profiles (id) on delete set null,
  related_type public.task_related_type,
  related_id uuid,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'new',
  deadline timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_assigned_to_idx on public.tasks (assigned_to);
create index tasks_status_idx on public.tasks (status);
create index tasks_priority_idx on public.tasks (priority);
create index tasks_related_idx on public.tasks (related_type, related_id);
create index tasks_deadline_idx on public.tasks (deadline);
create index tasks_created_at_idx on public.tasks (created_at desc);

comment on table public.tasks is
  'Задачи операционного центра ЦКР';

create trigger tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

alter table public.tasks enable row level security;

drop policy if exists "tasks_operator_all" on public.tasks;
create policy "tasks_operator_all"
on public.tasks
for all
to authenticated
using (public.is_operator(auth.uid()))
with check (public.is_operator(auth.uid()));

-- ---------------------------------------------------------------------------
-- sla_rules
-- ---------------------------------------------------------------------------
create table public.sla_rules (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null unique,
  time_limit_hours integer not null check (time_limit_hours > 0),
  active boolean not null default true,
  label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sla_rules_active_idx on public.sla_rules (active);

comment on table public.sla_rules is
  'Базовые SLA-правила операционного центра ЦКР';

create trigger sla_rules_set_updated_at
before update on public.sla_rules
for each row
execute function public.set_updated_at();

insert into public.sla_rules (entity_type, time_limit_hours, active, label) values
  ('lead', 24, true, 'Новый лид'),
  ('application', 48, true, 'Заявка без ответа'),
  ('verification', 72, true, 'Проверка документов / верификация')
on conflict (entity_type) do nothing;

alter table public.sla_rules enable row level security;

drop policy if exists "sla_rules_operator_select" on public.sla_rules;
create policy "sla_rules_operator_select"
on public.sla_rules
for select
to authenticated
using (public.is_operator(auth.uid()));

drop policy if exists "sla_rules_admin_all" on public.sla_rules;
create policy "sla_rules_admin_all"
on public.sla_rules
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- Оператор: чтение очереди (лиды, проекты, заявки, сделки, документы)
-- ---------------------------------------------------------------------------
drop policy if exists "leads_operator_select" on public.leads;
create policy "leads_operator_select"
on public.leads
for select
to authenticated
using (public.is_operator(auth.uid()));

drop policy if exists "crm_contacts_operator_select" on public.crm_contacts;
create policy "crm_contacts_operator_select"
on public.crm_contacts
for select
to authenticated
using (public.is_operator(auth.uid()));

drop policy if exists "projects_operator_select" on public.projects;
create policy "projects_operator_select"
on public.projects
for select
to authenticated
using (public.is_operator(auth.uid()));

drop policy if exists "applications_operator_select" on public.applications;
create policy "applications_operator_select"
on public.applications
for select
to authenticated
using (public.is_operator(auth.uid()));

drop policy if exists "deals_operator_select" on public.deals;
create policy "deals_operator_select"
on public.deals
for select
to authenticated
using (public.is_operator(auth.uid()));

drop policy if exists "documents_operator_select" on public.documents;
create policy "documents_operator_select"
on public.documents
for select
to authenticated
using (public.is_operator(auth.uid()));

drop policy if exists "verification_requests_operator_select"
on public.verification_requests;
create policy "verification_requests_operator_select"
on public.verification_requests
for select
to authenticated
using (public.is_operator(auth.uid()));

drop policy if exists "profiles_operator_select" on public.profiles;
create policy "profiles_operator_select"
on public.profiles
for select
to authenticated
using (public.is_operator(auth.uid()));
