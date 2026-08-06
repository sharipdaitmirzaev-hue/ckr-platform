-- ЦКР Этап 37: Product Improvement Loop — цикл улучшений по данным пилота

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.product_improvement_priority as enum (
  'critical',
  'high',
  'medium',
  'low'
);

create type public.product_improvement_status as enum (
  'planned',
  'in_progress',
  'released',
  'rejected'
);

create type public.product_improvement_source as enum (
  'feedback',
  'pilot_issue',
  'analytics',
  'lia',
  'manual'
);

-- Связь feedback → pilot_issues
alter table public.pilot_issues
  add column if not exists source_type text,
  add column if not exists source_id uuid;

create index if not exists pilot_issues_source_idx
  on public.pilot_issues (source_type, source_id);

comment on column public.pilot_issues.source_type is
  'Источник проблемы: feedback | analytics | lia | manual';
comment on column public.pilot_issues.source_id is
  'ID исходной записи (например feedback.id)';

-- ---------------------------------------------------------------------------
-- product_improvements
-- ---------------------------------------------------------------------------
create table public.product_improvements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  source_type public.product_improvement_source not null default 'manual',
  source_id uuid,
  priority public.product_improvement_priority not null default 'medium',
  status public.product_improvement_status not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_improvements_status_idx
  on public.product_improvements (status, created_at desc);
create index product_improvements_priority_idx
  on public.product_improvements (priority);
create index product_improvements_source_idx
  on public.product_improvements (source_type, source_id);

comment on table public.product_improvements is
  'Улучшения продукта ЦКР по данным закрытого пилота';

create trigger product_improvements_set_updated_at
before update on public.product_improvements
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.product_improvements enable row level security;

create policy "product_improvements_staff_all"
on public.product_improvements
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
