-- ЦКР Этап 63: First Deals & Revenue — коммерческий статус сделок + услуги по запросу
-- Без новой финансовой системы и без реальных платежей.

create type public.deal_revenue_status as enum (
  'potential',
  'agreed',
  'invoiced',
  'paid',
  'cancelled'
);

alter table public.deals
  add column if not exists revenue_status public.deal_revenue_status;

-- Бэкфилл из lifecycle / commission
update public.deals
set revenue_status = case
  when status = 'cancelled' then 'cancelled'::public.deal_revenue_status
  when commission_status = 'paid' or status = 'completed' then 'paid'::public.deal_revenue_status
  when status = 'active' then 'invoiced'::public.deal_revenue_status
  when status = 'agreement' then 'agreed'::public.deal_revenue_status
  else 'potential'::public.deal_revenue_status
end
where revenue_status is null;

alter table public.deals
  alter column revenue_status set default 'potential';

update public.deals set revenue_status = 'potential' where revenue_status is null;

alter table public.deals
  alter column revenue_status set not null;

create index if not exists deals_revenue_status_idx
  on public.deals (revenue_status);

comment on column public.deals.revenue_status is
  'Коммерческий результат сделки ЦКР (этап 63): potential→paid';

-- Цена по запросу для услуг (фиксированная цена остаётся в price)
alter table public.services
  add column if not exists price_on_request boolean not null default false;

comment on column public.services.price_on_request is
  'true = цена по запросу; окончательную цену задаёт администратор';

-- Стартовый набор услуг ЦКР (идемпотентно по id)
insert into public.services (id, title, description, category, price, status, price_on_request)
values
(
  'e000000e-0000-4000-8000-000000000001',
  'Аудит бизнеса',
  'Диагностика действующего бизнеса: сильные/слабые стороны, риски и следующие шаги в ЦКР.',
  'consulting',
  0,
  'active',
  true
),
(
  'e000000e-0000-4000-8000-000000000002',
  'Подготовка проекта',
  'Упаковка бизнес-идеи в карточку проекта ЦКР: цели, ресурсы, стадии.',
  'business_plan',
  0,
  'active',
  true
),
(
  'e000000e-0000-4000-8000-000000000003',
  'Поиск партнёров',
  'Подбор организаций и партнёров экосистемы под задачу проекта.',
  'marketing',
  0,
  'active',
  true
),
(
  'e000000e-0000-4000-8000-000000000004',
  'Поиск инвестиций',
  'Подбор инвестиционных предложений и подготовка к переговорам.',
  'investment_search',
  0,
  'active',
  true
),
(
  'e000000e-0000-4000-8000-000000000005',
  'Проектное сопровождение',
  'Ведение этапов, сделок и коммуникаций проекта до результата.',
  'project_support',
  0,
  'active',
  true
),
(
  'e000000e-0000-4000-8000-000000000006',
  'Юридическое / экспертное сопровождение',
  'Договоры, экспертиза и сопровождение коммерческих договорённостей.',
  'legal',
  0,
  'active',
  true
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  price_on_request = excluded.price_on_request,
  status = excluded.status;
