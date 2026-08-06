-- ЦКР Этап 16: монетизация — тарифы, подписки, услуги, комиссия сделок
-- Ценность: доступ к возможностям, сопровождение, успешные сделки, услуги — не доска платных объявлений.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.subscription_plan_type as enum (
  'investor',
  'company',
  'expert',
  'enterprise'
);

create type public.subscription_plan_status as enum (
  'active',
  'inactive'
);

create type public.subscription_status as enum (
  'active',
  'expired',
  'cancelled'
);

create type public.service_category as enum (
  'business_plan',
  'legal',
  'marketing',
  'consulting',
  'investment_search',
  'project_support'
);

create type public.service_status as enum (
  'active',
  'inactive'
);

create type public.commission_type as enum (
  'fixed',
  'percent'
);

create type public.commission_status as enum (
  'pending',
  'paid',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- subscription_plans
-- ---------------------------------------------------------------------------
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.subscription_plan_type not null,
  description text not null default '',
  price numeric(18, 2) not null default 0,
  period text not null default 'month'
    check (period in ('month', 'year', 'once')),
  features jsonb not null default '[]'::jsonb,
  status public.subscription_plan_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscription_plans_type_idx on public.subscription_plans (type);
create index subscription_plans_status_idx on public.subscription_plans (status);

comment on table public.subscription_plans is
  'Тарифы ЦКР: доступ к возможностям и сопровождению по ролям';

create trigger subscription_plans_set_updated_at
before update on public.subscription_plans
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  status public.subscription_status not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);
create index subscriptions_plan_id_idx on public.subscriptions (plan_id);
create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_user_active_idx
  on public.subscriptions (user_id)
  where status = 'active';

comment on table public.subscriptions is
  'Подписки пользователей на тарифы ЦКР';

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- services (платные услуги ЦКР)
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category public.service_category not null,
  price numeric(18, 2) not null default 0,
  status public.service_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_category_idx on public.services (category);
create index services_status_idx on public.services (status);

comment on table public.services is
  'Профессиональные услуги ЦКР: планы, право, маркетинг, сопровождение';

create trigger services_set_updated_at
before update on public.services
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- deals: комиссия
-- ---------------------------------------------------------------------------
alter table public.deals
  add column if not exists commission_type public.commission_type,
  add column if not exists commission_amount numeric(18, 2),
  add column if not exists commission_status public.commission_status;

comment on column public.deals.commission_type is
  'Тип комиссии ЦКР: fixed | percent';
comment on column public.deals.commission_amount is
  'Сумма (fixed) или процент (percent) комиссии';
comment on column public.deals.commission_status is
  'Статус комиссии: pending | paid | cancelled';

-- ---------------------------------------------------------------------------
-- Seed: тарифы и услуги (идемпотентно по name/title)
-- ---------------------------------------------------------------------------
insert into public.subscription_plans (name, type, description, price, period, features, status)
select * from (values
  (
    'Инвестор',
    'investor'::public.subscription_plan_type,
    'Доступ к каталогу проектов, приоритетные заявки и сопровождение сделок.',
    9900::numeric,
    'month',
    '["Каталог проектов без ограничений","Приоритет заявок","Уведомления о новых проектах","Базовое сопровождение сделок"]'::jsonb,
    'active'::public.subscription_plan_status
  ),
  (
    'Компания',
    'company'::public.subscription_plan_type,
    'Для команд: проекты, возможности, эксперты и рабочий кабинет реализации.',
    14900::numeric,
    'month',
    '["Публикация проектов и возможностей","Доступ к экспертам ЦКР","Кабинет проекта и сделки","Консультация Лии по сценариям"]'::jsonb,
    'active'::public.subscription_plan_status
  ),
  (
    'Эксперт',
    'expert'::public.subscription_plan_type,
    'Публичный профиль в каталоге доверия и заявки от проектов региона.',
    4900::numeric,
    'month',
    '["Профиль в каталоге экспертов","Заявки от предпринимателей","Участие в сделках проектов","Значок верификации после проверки"]'::jsonb,
    'active'::public.subscription_plan_status
  ),
  (
    'Enterprise',
    'enterprise'::public.subscription_plan_type,
    'Индивидуальное сопровождение портфеля проектов и выделенный менеджер ЦКР.',
    99000::numeric,
    'month',
    '["Всё из тарифа Компания","Выделенный менеджер","Индивидуальные комиссии","Приоритетная модерация","Отчётность по портфелю"]'::jsonb,
    'active'::public.subscription_plan_status
  )
) as v(name, type, description, price, period, features, status)
where not exists (
  select 1 from public.subscription_plans p where p.name = v.name
);

insert into public.services (title, description, category, price, status)
select * from (values
  (
    'Бизнес-план под проект',
    'Структура, финансы и дорожная карта под ваш проект в ЦКР.',
    'business_plan'::public.service_category,
    45000::numeric,
    'active'::public.service_status
  ),
  (
    'Юридическое сопровождение',
    'Договоры, корпоративная структура и проверка контрагентов.',
    'legal'::public.service_category,
    35000::numeric,
    'active'::public.service_status
  ),
  (
    'Маркетинг запуска',
    'Позиционирование, канал привлечения и материалы для инвесторов.',
    'marketing'::public.service_category,
    40000::numeric,
    'active'::public.service_status
  ),
  (
    'Стратегическая консультация',
    'Разбор идеи, ресурсов и следующего шага с экспертом ЦКР.',
    'consulting'::public.service_category,
    15000::numeric,
    'active'::public.service_status
  ),
  (
    'Поиск инвестиций',
    'Подбор инвесторов и подготовка к переговорам по проекту.',
    'investment_search'::public.service_category,
    60000::numeric,
    'active'::public.service_status
  ),
  (
    'Сопровождение проекта',
    'Ведение этапов, сделок и коммуникаций до результата.',
    'project_support'::public.service_category,
    80000::numeric,
    'active'::public.service_status
  )
) as v(title, description, category, price, status)
where not exists (
  select 1 from public.services s where s.title = v.title
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.services enable row level security;

-- Планы: публичное чтение активных; admin — всё
drop policy if exists "subscription_plans_select_active" on public.subscription_plans;
create policy "subscription_plans_select_active"
on public.subscription_plans
for select
to anon, authenticated
using (
  status = 'active'
  or public.is_admin(auth.uid())
);

drop policy if exists "subscription_plans_admin_all" on public.subscription_plans;
create policy "subscription_plans_admin_all"
on public.subscription_plans
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Услуги: публичное чтение активных; admin — всё
drop policy if exists "services_select_active" on public.services;
create policy "services_select_active"
on public.services
for select
to anon, authenticated
using (
  status = 'active'
  or public.is_admin(auth.uid())
);

drop policy if exists "services_admin_all" on public.services;
create policy "services_admin_all"
on public.services
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Подписки: свои + admin
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
on public.subscriptions
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);

drop policy if exists "subscriptions_insert_own" on public.subscriptions;
create policy "subscriptions_insert_own"
on public.subscriptions
for insert
to authenticated
with check (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);

drop policy if exists "subscriptions_update_own_or_admin" on public.subscriptions;
create policy "subscriptions_update_own_or_admin"
on public.subscriptions
for update
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
)
with check (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);
