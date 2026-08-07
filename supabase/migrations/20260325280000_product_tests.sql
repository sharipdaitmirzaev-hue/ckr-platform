-- ЦКР Этап 19: продуктовое тестирование — задачи и прогоны сценариев

create type public.product_test_status as enum (
  'pending',
  'in_progress',
  'passed',
  'failed',
  'blocked'
);

create type public.product_test_kind as enum (
  'scenario',
  'task'
);

create table public.product_tests (
  id uuid primary key default gen_random_uuid(),
  kind public.product_test_kind not null default 'task',
  scenario_key text,
  title text not null,
  description text not null default '',
  status public.product_test_status not null default 'pending',
  checklist jsonb not null default '[]'::jsonb,
  result_notes text not null default '',
  issues text not null default '',
  recommendations text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_tests_scenario_key_chk check (
    kind = 'task'
    or (scenario_key is not null and length(trim(scenario_key)) > 0)
  )
);

create index product_tests_kind_idx on public.product_tests (kind);
create index product_tests_scenario_key_idx on public.product_tests (scenario_key);
create index product_tests_status_idx on public.product_tests (status);
create index product_tests_created_at_idx on public.product_tests (created_at desc);

comment on table public.product_tests is
  'Продуктовые тесты ЦКР: прогоны сценариев и тестовые задачи';

create trigger product_tests_set_updated_at
before update on public.product_tests
for each row
execute function public.set_updated_at();

alter table public.product_tests enable row level security;

drop policy if exists "product_tests_admin_all" on public.product_tests;
create policy "product_tests_admin_all"
on public.product_tests
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
