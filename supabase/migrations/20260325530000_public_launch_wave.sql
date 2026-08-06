-- ЦКР Этап 58: Public Launch Wave 1 — управление публичным запуском
-- Волна создаётся как planned; активация только после PublicLaunchDecision = public_launch.

comment on column public.beta_invites.source is
  'Источник: public_launch_wave | open_beta_wave | beta_expansion_wave | first_users_wave | manual | referral | partner | internal';

comment on column public.beta_invites.channel is
  'Канал: email | partner | referral | social | events | content | website | internal | other';

comment on column public.feedback.category is
  'Категория: public_launch | UX | Lia | Project | Expert | Investment | Other';

insert into public.launch_waves (
  id, name, description, status, wave_type, start_date, end_date
) values (
  'c0000001-0000-4000-8000-000000000008',
  'Public Launch Wave 1',
  'Полноценный публичный запуск ЦКР после Decision Gate (public_launch): контроль 90 дней, каналы, KPI. Без новых крупных бизнес-модулей. Старт только после подтверждения решения.',
  'planned',
  'public',
  null,
  null
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  wave_type = 'public',
  -- не форсируем active: активация только из админки при decision = public_launch
  status = case
    when public.launch_waves.status = 'active' then 'active'
    when public.launch_waves.status = 'completed' then 'completed'
    else 'planned'
  end;

insert into public.launch_goals (
  id, wave_id, title, description, metric_type, target_value, current_value, status
) values
(
  'c000000b-0000-4000-8000-000000000001',
  'c0000001-0000-4000-8000-000000000008',
  '100 регистраций (90 дней)',
  'Public Launch: регистрации за первые 90 дней.',
  'users',
  100,
  0,
  'active'
),
(
  'c000000b-0000-4000-8000-000000000002',
  'c0000001-0000-4000-8000-000000000008',
  'Активация 40%',
  'Public Launch: доля активированных от зарегистрированных.',
  'activation',
  40,
  0,
  'active'
),
(
  'c000000b-0000-4000-8000-000000000003',
  'c0000001-0000-4000-8000-000000000008',
  '40 проектов',
  'Public Launch: созданные проекты экосистемы.',
  'projects',
  40,
  0,
  'active'
),
(
  'c000000b-0000-4000-8000-000000000004',
  'c0000001-0000-4000-8000-000000000008',
  '30 заявок',
  'Public Launch: заявки между ролями.',
  'applications',
  30,
  0,
  'active'
),
(
  'c000000b-0000-4000-8000-000000000005',
  'c0000001-0000-4000-8000-000000000008',
  '10 сделок',
  'Public Launch: сделки / партнёрства.',
  'deals',
  10,
  0,
  'active'
),
(
  'c000000b-0000-4000-8000-000000000006',
  'c0000001-0000-4000-8000-000000000008',
  'Лия ≥ 35%',
  'Public Launch: доля использовавших Лию.',
  'lia_usage',
  35,
  0,
  'active'
),
(
  'c000000b-0000-4000-8000-000000000007',
  'c0000001-0000-4000-8000-000000000008',
  'Feedback loop',
  'Public Launch: отзывы с категорией public_launch и связанный цикл улучшений.',
  'business_results',
  20,
  0,
  'active'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  metric_type = excluded.metric_type,
  target_value = excluded.target_value,
  status = 'active',
  updated_at = now();
