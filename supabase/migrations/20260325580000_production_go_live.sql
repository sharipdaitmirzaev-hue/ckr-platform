-- ЦКР Этап 64: Production Deployment & Go-Live

create type public.production_launch_decision_kind as enum (
  'go_live',
  'hold',
  'rollback'
);

create table public.production_launch_decisions (
  id uuid primary key default gen_random_uuid(),
  decision public.production_launch_decision_kind not null,
  notes text not null default '',
  responsible_name text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index production_launch_decisions_created_at_idx
  on public.production_launch_decisions (created_at desc);

comment on table public.production_launch_decisions is
  'Решения Go-Live / Hold / Rollback перед production (этап 64)';

alter table public.production_launch_decisions enable row level security;

create policy "production_launch_decisions_staff_all"
on public.production_launch_decisions
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
