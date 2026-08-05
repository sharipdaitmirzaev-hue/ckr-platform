-- ЦКР Этап 21: CRM — контакты, лиды, активности операторов

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.crm_contact_type as enum (
  'entrepreneur',
  'investor',
  'expert',
  'company',
  'partner',
  'other'
);

create type public.crm_contact_status as enum (
  'new',
  'active',
  'inactive'
);

create type public.crm_lead_stage as enum (
  'new',
  'contacted',
  'qualified',
  'project_created',
  'deal',
  'closed'
);

create type public.crm_activity_type as enum (
  'call',
  'meeting',
  'email',
  'comment',
  'task'
);

create type public.crm_task_status as enum (
  'open',
  'done',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- crm_contacts
-- ---------------------------------------------------------------------------
create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text not null default '',
  phone text not null default '',
  email text not null default '',
  type public.crm_contact_type not null default 'other',
  source text not null default '',
  assigned_to uuid references public.profiles (id) on delete set null,
  status public.crm_contact_status not null default 'new',
  notes text not null default '',
  linked_user_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index crm_contacts_email_idx on public.crm_contacts (lower(email));
create index crm_contacts_status_idx on public.crm_contacts (status);
create index crm_contacts_type_idx on public.crm_contacts (type);
create index crm_contacts_assigned_to_idx on public.crm_contacts (assigned_to);
create index crm_contacts_created_at_idx on public.crm_contacts (created_at desc);

comment on table public.crm_contacts is
  'CRM ЦКР: контакты клиентов, партнёров и потенциальных участников';

create trigger crm_contacts_set_updated_at
before update on public.crm_contacts
for each row
execute function public.set_updated_at();

alter table public.crm_contacts enable row level security;

drop policy if exists "crm_contacts_admin_all" on public.crm_contacts;
create policy "crm_contacts_admin_all"
on public.crm_contacts
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.crm_contacts (id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default '',
  assigned_to uuid references public.profiles (id) on delete set null,
  stage public.crm_lead_stage not null default 'new',
  converted_user_id uuid references public.profiles (id) on delete set null,
  converted_project_id uuid references public.projects (id) on delete set null,
  converted_opportunity_id uuid references public.opportunities (id) on delete set null,
  converted_investment_id uuid references public.investment_offers (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_contact_id_idx on public.leads (contact_id);
create index leads_stage_idx on public.leads (stage);
create index leads_assigned_to_idx on public.leads (assigned_to);
create index leads_created_at_idx on public.leads (created_at desc);

comment on table public.leads is
  'CRM ЦКР: лиды / потенциальные проекты и сделки';

create trigger leads_set_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

alter table public.leads enable row level security;

drop policy if exists "leads_admin_all" on public.leads;
create policy "leads_admin_all"
on public.leads
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- crm_activities
-- ---------------------------------------------------------------------------
create table public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.crm_contacts (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,
  type public.crm_activity_type not null default 'comment',
  title text not null default '',
  body text not null default '',
  task_status public.crm_task_status,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint crm_activities_target_chk check (
    contact_id is not null or lead_id is not null
  ),
  constraint crm_activities_task_status_chk check (
    (type = 'task' and task_status is not null)
    or (type <> 'task' and task_status is null)
  )
);

create index crm_activities_contact_id_idx on public.crm_activities (contact_id);
create index crm_activities_lead_id_idx on public.crm_activities (lead_id);
create index crm_activities_type_idx on public.crm_activities (type);
create index crm_activities_task_status_idx on public.crm_activities (task_status);
create index crm_activities_created_at_idx on public.crm_activities (created_at desc);

comment on table public.crm_activities is
  'CRM ЦКР: звонки, встречи, письма, комментарии и задачи';

alter table public.crm_activities enable row level security;

drop policy if exists "crm_activities_admin_all" on public.crm_activities;
create policy "crm_activities_admin_all"
on public.crm_activities
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
