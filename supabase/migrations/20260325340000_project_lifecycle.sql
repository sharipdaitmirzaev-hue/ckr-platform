-- ЦКР Этап 25: единый жизненный цикл проекта (часть 1 — enum)
-- draft → moderation → published → active → completed → archived

alter type public.project_status add value if not exists 'active';
alter type public.project_status add value if not exists 'completed';

comment on type public.project_status is
  'Жизненный цикл проекта ЦКР: draft → moderation → published → active → completed → archived';
