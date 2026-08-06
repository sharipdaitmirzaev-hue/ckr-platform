-- ЦКР Этап 42: Launch Goals — цели и метрики успешности волн

create type public.launch_goal_status as enum (
  'active',
  'achieved',
  'failed',
  'cancelled'
);

create type public.launch_goal_metric_type as enum (
  'users',
  'activation',
  'projects',
  'applications',
  'deals',
  'lia_usage',
  'business_results'
);

create table public.launch_goals (
  id uuid primary key default gen_random_uuid(),
  wave_id uuid not null references public.launch_waves (id) on delete cascade,
  title text not null,
  description text not null default '',
  metric_type public.launch_goal_metric_type not null default 'users',
  target_value numeric not null default 0,
  current_value numeric not null default 0,
  status public.launch_goal_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index launch_goals_wave_id_idx on public.launch_goals (wave_id);
create index launch_goals_status_idx on public.launch_goals (status);
create index launch_goals_metric_type_idx on public.launch_goals (metric_type);

comment on table public.launch_goals is
  'Цели запуска ЦКР, привязанные к launch_waves';

create trigger launch_goals_set_updated_at
before update on public.launch_goals
for each row
execute function public.set_updated_at();

alter table public.launch_goals enable row level security;

create policy "launch_goals_staff_all"
on public.launch_goals
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

-- Seed: цели Closed Wave (Волна 1) + бизнес-цели ТИНДА
insert into public.launch_goals (
  id, wave_id, title, description, metric_type, target_value, current_value, status
) values
(
  'c0000003-0000-4000-8000-000000000001',
  'c0000001-0000-4000-8000-000000000002',
  '20 участников волны',
  'Команда и приглашённые участники closed wave (в т.ч. команда ТИНДА).',
  'users',
  20,
  0,
  'active'
),
(
  'c0000003-0000-4000-8000-000000000002',
  'c0000001-0000-4000-8000-000000000002',
  '10 заполненных профилей',
  'Активация: профиль завершён / первое осмысленное действие.',
  'activation',
  10,
  0,
  'active'
),
(
  'c0000003-0000-4000-8000-000000000003',
  'c0000001-0000-4000-8000-000000000002',
  '5 проектов',
  'Создание проектов участниками волны.',
  'projects',
  5,
  0,
  'active'
),
(
  'c0000003-0000-4000-8000-000000000004',
  'c0000001-0000-4000-8000-000000000002',
  '3 заявки',
  'Заявки между участниками / на объекты каталога.',
  'applications',
  3,
  0,
  'active'
),
(
  'c0000003-0000-4000-8000-000000000005',
  'c0000001-0000-4000-8000-000000000002',
  '1 сделка',
  'Минимум одна сделка в контуре волны.',
  'deals',
  1,
  0,
  'active'
),
(
  'c0000003-0000-4000-8000-000000000006',
  'c0000001-0000-4000-8000-000000000002',
  'Использование Лии',
  'Участники применяют Лию хотя бы один раз.',
  'lia_usage',
  5,
  0,
  'active'
),
(
  'c0000003-0000-4000-8000-000000000007',
  'c0000001-0000-4000-8000-000000000002',
  'Контакты клиентов ТИНДА',
  'Бизнес-цель ТИНДА: количество контактов клиентов в CRM.',
  'business_results',
  2,
  0,
  'active'
),
(
  'c0000003-0000-4000-8000-000000000008',
  'c0000001-0000-4000-8000-000000000002',
  'Переговоры ТИНДА',
  'Бизнес-цель ТИНДА: количество переговоров / лидов.',
  'business_results',
  2,
  0,
  'active'
),
(
  'c0000003-0000-4000-8000-000000000009',
  'c0000001-0000-4000-8000-000000000002',
  'Партнёры ТИНДА',
  'Бизнес-цель ТИНДА: количество партнёрств.',
  'business_results',
  2,
  0,
  'active'
),
(
  'c0000003-0000-4000-8000-00000000000a',
  'c0000001-0000-4000-8000-000000000002',
  'Сделки ТИНДА',
  'Бизнес-цель ТИНДА: количество сделок по проекту.',
  'deals',
  1,
  0,
  'active'
)
on conflict (id) do nothing;
