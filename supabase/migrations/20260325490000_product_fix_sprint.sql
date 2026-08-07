-- ЦКР Этап 52: Product Fix Sprint — seed улучшений по First Users Review

insert into public.product_improvements (
  id, title, description, source_type, source_id, priority, status
) values
(
  'c0000008-0000-4000-8000-000000000001',
  'Неясный первый шаг после профиля',
  'First Users Review: пользователи останавливаются после онбординга. Исправлен UX: FirstIntentPrompt, пути ролей, empty states.',
  'analytics',
  null,
  'critical',
  'released'
),
(
  'c0000008-0000-4000-8000-000000000002',
  'Путь ролей не сформулирован коротко',
  'Короткие цепочки: предприниматель Идея→Проект; эксперт Профиль→Доверие→Запросы; инвестор Проекты→Интерес; организация Потребность→Партнёры.',
  'manual',
  null,
  'critical',
  'released'
),
(
  'c0000008-0000-4000-8000-000000000003',
  'Лия: слабый мост к действию',
  'Lia Improvement Notes: понятность вопросов, первый ответ с CTA, переход к действию. Логика движка не менялась.',
  'lia',
  null,
  'high',
  'released'
),
(
  'c0000008-0000-4000-8000-000000000004',
  'Empty states без следующего шага',
  'Усилены empty states и CTA в кабинете / на главной для первого действия.',
  'analytics',
  null,
  'high',
  'released'
),
(
  'c0000008-0000-4000-8000-000000000005',
  'Регистрация: неочевиден путь к Лие',
  'Тексты /register и публичного входа: Главная → Лия → Регистрация → Роль → Онбординг → Первое действие.',
  'feedback',
  null,
  'high',
  'released'
),
(
  'c0000008-0000-4000-8000-000000000006',
  'Доверие эксперта неочевидно',
  'Путь эксперта Профиль → Доверие → Запросы — в подсказках и онбординге; проверка verification ещё в работе.',
  'manual',
  null,
  'medium',
  'in_progress'
),
(
  'c0000008-0000-4000-8000-000000000007',
  'Инвестор: интерес спрятан',
  'Усилить «Проекты → Интерес» в кабинете инвестора и на карточках проектов.',
  'analytics',
  null,
  'medium',
  'planned'
),
(
  'c0000008-0000-4000-8000-000000000008',
  'Организация: путь к партнёрам',
  'Потребность → Партнёры на /organization и /partner.',
  'manual',
  null,
  'low',
  'planned'
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  priority = excluded.priority,
  status = excluded.status,
  updated_at = now();
