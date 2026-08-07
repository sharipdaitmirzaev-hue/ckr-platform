-- ЦКР Этап 45: Launch Decision Gate + подготовка Launch Wave 2

-- ---------------------------------------------------------------------------
-- Тип волны: beta (между closed и public)
-- ---------------------------------------------------------------------------
alter type public.launch_wave_type add value if not exists 'beta';

comment on type public.launch_wave_type is
  'Типы волн: internal / closed / beta / public';

-- ---------------------------------------------------------------------------
-- Журнал решений Decision Gate
-- ---------------------------------------------------------------------------
create type public.launch_decision_kind as enum (
  'continue_closed',
  'expand_beta',
  'public_launch_ready',
  'needs_improvement'
);

create table public.launch_decisions (
  id uuid primary key default gen_random_uuid(),
  wave_id uuid references public.launch_waves (id) on delete set null,
  decision public.launch_decision_kind not null,
  notes text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index launch_decisions_wave_id_idx on public.launch_decisions (wave_id);
create index launch_decisions_created_at_idx
  on public.launch_decisions (created_at desc);

comment on table public.launch_decisions is
  'Решения Decision Gate после launch waves';

alter table public.launch_decisions enable row level security;

create policy "launch_decisions_staff_all"
on public.launch_decisions
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
-- Launch Wave 2 (planned, beta) — экосистема, не один проект
-- ---------------------------------------------------------------------------
insert into public.launch_waves (
  id, name, description, status, wave_type, start_date, end_date
) values (
  'c0000001-0000-4000-8000-000000000004',
  'Launch Wave 2',
  'Вторая волна: предприниматели, инвесторы и эксперты. Проверка взаимодействия экосистемы ЦКР (не один проект). Тип beta/closed.',
  'planned',
  'closed',
  null,
  null
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status;

-- После добавления enum beta — перевести Wave 2 на beta (отдельный update безопаснее в той же миграции после add value)
-- В PostgreSQL новое значение enum нельзя использовать в том же transaction иногда —
-- поэтому Wave 2 создаём как closed, затем ниже на beta если доступно.

do $$
begin
  update public.launch_waves
  set wave_type = 'beta'
  where id = 'c0000001-0000-4000-8000-000000000004';
exception
  when others then
    -- оставляем closed, если beta ещё не видна в транзакции
    null;
end $$;

-- Переименовать бывшую public-волну в Wave 3 (public, planned)
update public.launch_waves
set
  name = 'Launch Wave 3 — Public',
  description = 'Ограниченный public / waitlist после стабилизации Wave 2.',
  status = 'planned',
  wave_type = 'public'
where id = 'c0000001-0000-4000-8000-000000000003';

-- ---------------------------------------------------------------------------
-- Цели Launch Wave 2
-- ---------------------------------------------------------------------------
insert into public.launch_goals (
  id, wave_id, title, description, metric_type, target_value, current_value, status
) values
-- Пользователи
(
  'c0000005-0000-4000-8000-000000000001',
  'c0000001-0000-4000-8000-000000000004',
  '20 предпринимателей',
  'Пользователи: предприниматели в Wave 2.',
  'users',
  20,
  0,
  'active'
),
(
  'c0000005-0000-4000-8000-000000000002',
  'c0000001-0000-4000-8000-000000000004',
  '5 экспертов',
  'Пользователи: эксперты в Wave 2.',
  'users',
  5,
  0,
  'active'
),
(
  'c0000005-0000-4000-8000-000000000003',
  'c0000001-0000-4000-8000-000000000004',
  '3 инвестора',
  'Пользователи: инвесторы в Wave 2.',
  'users',
  3,
  0,
  'active'
),
-- Активность
(
  'c0000005-0000-4000-8000-000000000004',
  'c0000001-0000-4000-8000-000000000004',
  'Заполненные профили',
  'Активность: профили участников заполнены.',
  'activation',
  20,
  0,
  'active'
),
(
  'c0000005-0000-4000-8000-000000000005',
  'c0000001-0000-4000-8000-000000000004',
  'Проекты Wave 2',
  'Активность: созданные проекты экосистемы.',
  'projects',
  10,
  0,
  'active'
),
(
  'c0000005-0000-4000-8000-000000000006',
  'c0000001-0000-4000-8000-000000000004',
  'Интересы',
  'Активность: отмеченные интересы к проектам/инвестициям.',
  'activation',
  15,
  0,
  'active'
),
(
  'c0000005-0000-4000-8000-000000000007',
  'c0000001-0000-4000-8000-000000000004',
  'Заявки Wave 2',
  'Активность: заявки между ролями экосистемы.',
  'applications',
  10,
  0,
  'active'
),
-- Результаты
(
  'c0000005-0000-4000-8000-000000000008',
  'c0000001-0000-4000-8000-000000000004',
  'Первые связи',
  'Результаты: принятые заявки / связи участников.',
  'applications',
  5,
  0,
  'active'
),
(
  'c0000005-0000-4000-8000-000000000009',
  'c0000001-0000-4000-8000-000000000004',
  'Первые сделки',
  'Результаты: сделки экосистемы Wave 2.',
  'deals',
  3,
  0,
  'active'
),
(
  'c0000005-0000-4000-8000-00000000000a',
  'c0000001-0000-4000-8000-000000000004',
  'Первые партнёрства',
  'Результаты: партнёрства организаций.',
  'business_results',
  2,
  0,
  'active'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  metric_type = excluded.metric_type,
  target_value = excluded.target_value,
  status = excluded.status,
  updated_at = now();
