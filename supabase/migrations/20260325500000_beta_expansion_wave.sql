-- ЦКР Этап 53: Beta Expansion Wave — расширенная закрытая beta после Product Fix Sprint

comment on column public.beta_invites.source is
  'Источник приглашения: beta_expansion_wave | first_users_wave | manual | referral | partner | internal';

-- ---------------------------------------------------------------------------
-- First Users Wave → completed; Beta Expansion Wave → active (beta)
-- ---------------------------------------------------------------------------
update public.launch_waves
set
  status = 'completed',
  end_date = coalesce(end_date, current_date)
where id = 'c0000001-0000-4000-8000-000000000005'
  and status = 'active';

insert into public.launch_waves (
  id, name, description, status, wave_type, start_date
) values (
  'c0000001-0000-4000-8000-000000000006',
  'Beta Expansion Wave',
  'Расширенная закрытая beta ЦКР после Product Fix Sprint: масштабирование сценариев, активация, качество связей. Без новых крупных бизнес-модулей.',
  'active',
  'beta',
  current_date
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  status = 'active',
  wave_type = 'beta',
  start_date = coalesce(public.launch_waves.start_date, excluded.start_date);

update public.launch_waves
set status = 'planned'
where status = 'active'
  and id <> 'c0000001-0000-4000-8000-000000000006';

update public.launch_waves
set status = 'active'
where id = 'c0000001-0000-4000-8000-000000000006';

-- ---------------------------------------------------------------------------
-- Цели Beta Expansion Wave
-- ---------------------------------------------------------------------------
insert into public.launch_goals (
  id, wave_id, title, description, metric_type, target_value, current_value, status
) values
(
  'c0000009-0000-4000-8000-000000000001',
  'c0000001-0000-4000-8000-000000000006',
  '20–30 предпринимателей',
  'Пригласить и активировать предпринимателей (цель: 25).',
  'users',
  25,
  0,
  'active'
),
(
  'c0000009-0000-4000-8000-000000000002',
  'c0000001-0000-4000-8000-000000000006',
  '5–10 экспертов',
  'Эксперты с профилем и взаимодействием (цель: 8).',
  'users',
  8,
  0,
  'active'
),
(
  'c0000009-0000-4000-8000-000000000003',
  'c0000001-0000-4000-8000-000000000006',
  '3–5 инвесторов',
  'Инвесторы с просмотром проектов и интересом (цель: 4).',
  'users',
  4,
  0,
  'active'
),
(
  'c0000009-0000-4000-8000-000000000004',
  'c0000001-0000-4000-8000-000000000006',
  '5 организаций',
  'Организации с профилем и партнёрским путём (цель: 5).',
  'users',
  5,
  0,
  'active'
),
(
  'c0000009-0000-4000-8000-000000000005',
  'c0000001-0000-4000-8000-000000000006',
  '80% завершили регистрацию',
  'Доля invite → registered/activated от приглашённых.',
  'activation',
  80,
  0,
  'active'
),
(
  'c0000009-0000-4000-8000-000000000006',
  'c0000001-0000-4000-8000-000000000006',
  '70% заполнили профиль',
  'Доля зарегистрированных с profile_completed / onboarding_completed.',
  'activation',
  70,
  0,
  'active'
),
(
  'c0000009-0000-4000-8000-000000000007',
  'c0000001-0000-4000-8000-000000000006',
  '50% использовали Лию',
  'Доля зарегистрированных с lia_started / lia_first_used.',
  'lia_usage',
  50,
  0,
  'active'
),
(
  'c0000009-0000-4000-8000-000000000008',
  'c0000001-0000-4000-8000-000000000006',
  '30% создали первый объект',
  'Доля с first_object_created / первым действием роли.',
  'activation',
  30,
  0,
  'active'
),
(
  'c0000009-0000-4000-8000-000000000009',
  'c0000001-0000-4000-8000-000000000006',
  '20 проектов',
  'Проекты в экосистеме волны (цель: 20).',
  'projects',
  20,
  0,
  'active'
),
(
  'c0000009-0000-4000-8000-00000000000a',
  'c0000001-0000-4000-8000-000000000006',
  '10 экспертных взаимодействий',
  'Заявки/запросы к экспертам и связанные взаимодействия (цель: 10).',
  'applications',
  10,
  0,
  'active'
),
(
  'c0000009-0000-4000-8000-00000000000b',
  'c0000001-0000-4000-8000-000000000006',
  '10 интересов инвесторов',
  'investor_interests по проектам/предложениям (цель: 10).',
  'business_results',
  10,
  0,
  'active'
),
(
  'c0000009-0000-4000-8000-00000000000c',
  'c0000001-0000-4000-8000-000000000006',
  '5 заявок',
  'Заявки (applications) между участниками (цель: 5).',
  'applications',
  5,
  0,
  'active'
),
(
  'c0000009-0000-4000-8000-00000000000d',
  'c0000001-0000-4000-8000-000000000006',
  'Первые сделки/партнёрства',
  'Первые deals или партнёрские связи в расширенной beta (цель: 1).',
  'deals',
  1,
  0,
  'active'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  target_value = excluded.target_value,
  status = 'active',
  updated_at = now();
