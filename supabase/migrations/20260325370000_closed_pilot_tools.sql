-- ЦКР Этап 29: инструменты closed pilot (feedback linkage + pilot_issues)

-- ---------------------------------------------------------------------------
-- feedback: связь с объектом
-- ---------------------------------------------------------------------------
alter table public.feedback
  add column if not exists related_type text;

alter table public.feedback
  add column if not exists related_id uuid;

create index if not exists feedback_related_idx
  on public.feedback (related_type, related_id)
  where related_type is not null;

comment on column public.feedback.related_type is
  'Тип связанного объекта (project / opportunity / investment / deal / …)';
comment on column public.feedback.related_id is
  'ID связанного объекта на странице обратной связи';

-- Операторы тоже читают feedback в пилоте
drop policy if exists "feedback_select_own_or_admin" on public.feedback;
create policy "feedback_select_own_or_staff"
on public.feedback
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
);

-- ---------------------------------------------------------------------------
-- pilot_issues
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.pilot_issue_severity as enum (
    'critical',
    'high',
    'medium',
    'low'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.pilot_issue_status as enum (
    'open',
    'in_progress',
    'resolved',
    'closed'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.pilot_issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  severity public.pilot_issue_severity not null default 'medium',
  status public.pilot_issue_status not null default 'open',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pilot_issues_status_idx
  on public.pilot_issues (status, created_at desc);
create index if not exists pilot_issues_severity_idx
  on public.pilot_issues (severity);

comment on table public.pilot_issues is
  'Проблемы и наблюдения закрытого пилота ЦКР';

alter table public.pilot_issues enable row level security;

drop policy if exists "pilot_issues_staff_select" on public.pilot_issues;
create policy "pilot_issues_staff_select"
on public.pilot_issues
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
);

drop policy if exists "pilot_issues_staff_insert" on public.pilot_issues;
create policy "pilot_issues_staff_insert"
on public.pilot_issues
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
);

drop policy if exists "pilot_issues_staff_update" on public.pilot_issues;
create policy "pilot_issues_staff_update"
on public.pilot_issues
for update
to authenticated
using (
  public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
)
with check (
  public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
);

drop policy if exists "pilot_issues_admin_delete" on public.pilot_issues;
create policy "pilot_issues_admin_delete"
on public.pilot_issues
for delete
to authenticated
using (public.is_admin(auth.uid()));
