-- ЦКР Этап 11: история анализов Лии (создание проектов и поиск решений)

create table public.lia_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  summary text not null default '',
  available_resources jsonb not null default '[]'::jsonb,
  missing_resources jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  next_steps jsonb not null default '[]'::jsonb,
  internal_matches jsonb not null default '[]'::jsonb,
  external_results jsonb not null default '[]'::jsonb,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index lia_analyses_user_id_idx on public.lia_analyses (user_id);
create index lia_analyses_project_id_idx on public.lia_analyses (project_id);
create index lia_analyses_created_at_idx on public.lia_analyses (created_at desc);

comment on table public.lia_analyses is
  'Результаты анализа проектов Лией: SolutionDraft / SolutionReport (только рекомендации)';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.lia_analyses enable row level security;

create policy "lia_analyses_select_own"
on public.lia_analyses
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);

create policy "lia_analyses_insert_own"
on public.lia_analyses
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "lia_analyses_delete_own"
on public.lia_analyses
for delete
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);

-- Админ: полный доступ на чтение уже в select; обновление не требуется
-- (анализы иммутабельны — только insert/select/delete).
