-- ЦКР Этап 55: Open Beta Wave 1 — контролируемый публичный запуск

-- ---------------------------------------------------------------------------
-- beta_invites: статусы прохождения + канал привлечения
-- ---------------------------------------------------------------------------
alter type public.beta_invite_status add value if not exists 'registered';
alter type public.beta_invite_status add value if not exists 'inactive';

alter table public.beta_invites
  add column if not exists channel text not null default 'email';

comment on column public.beta_invites.source is
  'Источник приглашения: open_beta_wave | beta_expansion_wave | first_users_wave | manual | referral | partner | internal';

comment on column public.beta_invites.channel is
  'Канал привлечения: email | partner | referral | social | website | internal | other';

comment on type public.beta_invite_status is
  'invited | registered | activated | active | completed | inactive (+ legacy disabled/created/sent/used/expired)';

create index if not exists beta_invites_channel_idx
  on public.beta_invites (channel);

-- ---------------------------------------------------------------------------
-- feedback: категория Open Beta (UX / Lia / Project / Expert / Investment / Other)
-- ---------------------------------------------------------------------------
alter table public.feedback
  add column if not exists category text;

comment on column public.feedback.category is
  'Категория Open Beta: UX | Lia | Project | Expert | Investment | Other';

create index if not exists feedback_category_idx
  on public.feedback (category);

-- ---------------------------------------------------------------------------
-- Beta Expansion → completed; Open Beta Wave 1 → active (public)
-- ---------------------------------------------------------------------------
update public.launch_waves
set
  status = 'completed',
  end_date = coalesce(end_date, current_date)
where id = 'c0000001-0000-4000-8000-000000000006'
  and status = 'active';

insert into public.launch_waves (
  id, name, description, status, wave_type, start_date
) values (
  'c0000001-0000-4000-8000-000000000007',
  'Open Beta Wave 1',
  'Первый контролируемый публичный запуск ЦКР: приглашения, мониторинг активности, feedback loop и анализ первых публичных результатов. Без новых крупных бизнес-модулей.',
  'active',
  'public',
  current_date
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  status = 'active',
  wave_type = 'public',
  start_date = coalesce(public.launch_waves.start_date, excluded.start_date);

update public.launch_waves
set status = 'planned'
where status = 'active'
  and id <> 'c0000001-0000-4000-8000-000000000007';

update public.launch_waves
set status = 'active'
where id = 'c0000001-0000-4000-8000-000000000007';

-- ---------------------------------------------------------------------------
-- Цели Open Beta Wave 1
-- ---------------------------------------------------------------------------
insert into public.launch_goals (
  id, wave_id, title, description, metric_type, target_value, current_value, status
) values
(
  'c000000a-0000-4000-8000-000000000001',
  'c0000001-0000-4000-8000-000000000007',
  '50 приглашённых',
  'Контролируемый набор приглашений Wave 1 (цель: 50).',
  'users',
  50,
  0,
  'active'
),
(
  'c000000a-0000-4000-8000-000000000002',
  'c0000001-0000-4000-8000-000000000007',
  '30 зарегистрированных',
  'Доля invite → registered/activated (цель: 30).',
  'users',
  30,
  0,
  'active'
),
(
  'c000000a-0000-4000-8000-000000000003',
  'c0000001-0000-4000-8000-000000000007',
  '20 активированных',
  'Профиль / онбординг завершён (цель: 20).',
  'activation',
  20,
  0,
  'active'
),
(
  'c000000a-0000-4000-8000-000000000004',
  'c0000001-0000-4000-8000-000000000007',
  '15 активных',
  'Статус active в когорте Open Beta (цель: 15).',
  'activation',
  15,
  0,
  'active'
),
(
  'c000000a-0000-4000-8000-000000000005',
  'c0000001-0000-4000-8000-000000000007',
  '25 проектов',
  'Созданные проекты в экосистеме (цель: 25).',
  'projects',
  25,
  0,
  'active'
),
(
  'c000000a-0000-4000-8000-000000000006',
  'c0000001-0000-4000-8000-000000000007',
  '10 заявок',
  'Заявки между участниками (цель: 10).',
  'applications',
  10,
  0,
  'active'
),
(
  'c000000a-0000-4000-8000-000000000007',
  'c0000001-0000-4000-8000-000000000007',
  '15 интересов',
  'Интересы инвесторов (цель: 15).',
  'business_results',
  15,
  0,
  'active'
),
(
  'c000000a-0000-4000-8000-000000000008',
  'c0000001-0000-4000-8000-000000000007',
  '35% использовали Лию',
  'Доля зарегистрированных с lia_started / lia_first_used.',
  'lia_usage',
  35,
  0,
  'active'
),
(
  'c000000a-0000-4000-8000-000000000009',
  'c0000001-0000-4000-8000-000000000007',
  'Feedback от когорты',
  'Структурированный feedback с категориями Open Beta (цель: 10).',
  'business_results',
  10,
  0,
  'active'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  target_value = excluded.target_value,
  status = 'active',
  updated_at = now();
