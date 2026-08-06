-- ЦКР Этап 50: First Users Wave — ограниченный запуск на реальных пользователях

-- ---------------------------------------------------------------------------
-- beta_invites: статус active + источник приглашения
-- ---------------------------------------------------------------------------
alter type public.beta_invite_status add value if not exists 'active';

alter table public.beta_invites
  add column if not exists source text not null default 'manual';

comment on column public.beta_invites.source is
  'Источник приглашения: first_users_wave | manual | referral | partner | internal';

create index if not exists beta_invites_source_idx
  on public.beta_invites (source);

comment on type public.beta_invite_status is
  'invited | activated | active | completed | disabled (+ legacy created/sent/used/expired)';

-- ---------------------------------------------------------------------------
-- Wave 2 → completed; First Users Wave → active (closed)
-- ---------------------------------------------------------------------------
update public.launch_waves
set
  status = 'completed',
  end_date = coalesce(end_date, current_date)
where id = 'c0000001-0000-4000-8000-000000000004'
  and status = 'active';

insert into public.launch_waves (
  id, name, description, status, wave_type, start_date
) values (
  'c0000001-0000-4000-8000-000000000005',
  'First Users Wave',
  'Первый запуск ЦКР на ограниченной группе реальных пользователей: приглашения, сценарии по ролям, feedback loop и анализ поведения. Без массового запуска и новых бизнес-модулей.',
  'active',
  'closed',
  current_date
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  status = 'active',
  wave_type = 'closed',
  start_date = coalesce(public.launch_waves.start_date, excluded.start_date);

-- убедиться, что только эта волна active
update public.launch_waves
set status = 'planned'
where status = 'active'
  and id <> 'c0000001-0000-4000-8000-000000000005';

update public.launch_waves
set status = 'active'
where id = 'c0000001-0000-4000-8000-000000000005';

-- ---------------------------------------------------------------------------
-- Цели First Users Wave
-- ---------------------------------------------------------------------------
insert into public.launch_goals (
  id, wave_id, title, description, metric_type, target_value, current_value, status
) values
(
  'c0000007-0000-4000-8000-000000000001',
  'c0000001-0000-4000-8000-000000000005',
  '5–10 предпринимателей',
  'Пригласить и активировать предпринимателей (цель: 8).',
  'users',
  8,
  0,
  'active'
),
(
  'c0000007-0000-4000-8000-000000000002',
  'c0000001-0000-4000-8000-000000000005',
  '2–3 эксперта',
  'Эксперты с профилем компетенций (цель: 3).',
  'users',
  3,
  0,
  'active'
),
(
  'c0000007-0000-4000-8000-000000000003',
  'c0000001-0000-4000-8000-000000000005',
  '1–2 инвестора',
  'Инвесторы с просмотром проектов и интересом (цель: 2).',
  'users',
  2,
  0,
  'active'
),
(
  'c0000007-0000-4000-8000-000000000004',
  'c0000001-0000-4000-8000-000000000005',
  '1–3 организации',
  'Организации с профилем (цель: 2).',
  'users',
  2,
  0,
  'active'
),
(
  'c0000007-0000-4000-8000-000000000005',
  'c0000001-0000-4000-8000-000000000005',
  '70% активация приглашений',
  'Доля invite → activated/active от отправленных.',
  'activation',
  70,
  0,
  'active'
),
(
  'c0000007-0000-4000-8000-000000000006',
  'c0000001-0000-4000-8000-000000000005',
  '50% до первого действия',
  'Доля зарегистрированных с first_object_created / первым действием.',
  'activation',
  50,
  0,
  'active'
),
(
  'c0000007-0000-4000-8000-000000000007',
  'c0000001-0000-4000-8000-000000000005',
  '40% использовали Лию',
  'Доля с lia_first_used / lia_started.',
  'lia_usage',
  40,
  0,
  'active'
),
(
  'c0000007-0000-4000-8000-000000000008',
  'c0000001-0000-4000-8000-000000000005',
  'Feedback от активных',
  'Число feedback_sent от участников волны (цель: 5).',
  'business_results',
  5,
  0,
  'active'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  target_value = excluded.target_value,
  status = 'active',
  updated_at = now();
