-- ЦКР Этап 3: opportunity_categories + opportunities

-- ---------------------------------------------------------------------------
-- Enum status
-- ---------------------------------------------------------------------------
create type public.opportunity_status as enum (
  'draft',
  'moderation',
  'published',
  'archived'
);

-- ---------------------------------------------------------------------------
-- opportunity_categories
-- ---------------------------------------------------------------------------
create table public.opportunity_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create index opportunity_categories_slug_idx on public.opportunity_categories (slug);

comment on table public.opportunity_categories is 'Категории/типы возможностей ЦКР';

insert into public.opportunity_categories (name, slug) values
  ('Земля', 'land'),
  ('Помещения', 'premises'),
  ('Оборудование', 'equipment'),
  ('Готовый бизнес', 'ready_business'),
  ('Технологии', 'technology'),
  ('Услуги', 'service'),
  ('Партнёры', 'partner');

-- ---------------------------------------------------------------------------
-- opportunities
-- ---------------------------------------------------------------------------
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  type text not null references public.opportunity_categories (slug),
  region text not null default '',
  city text not null default '',
  price numeric(18, 2),
  currency text not null default 'RUB',
  status public.opportunity_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index opportunities_owner_id_idx on public.opportunities (owner_id);
create index opportunities_status_idx on public.opportunities (status);
create index opportunities_type_idx on public.opportunities (type);
create index opportunities_region_idx on public.opportunities (region);

comment on table public.opportunities is 'Ресурсы и возможности для реализации проектов ЦКР';

create trigger opportunities_set_updated_at
before update on public.opportunities
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: opportunity_categories — публичное чтение
-- ---------------------------------------------------------------------------
alter table public.opportunity_categories enable row level security;

create policy "opportunity_categories_select_all"
on public.opportunity_categories
for select
to anon, authenticated
using (true);

-- ---------------------------------------------------------------------------
-- RLS: opportunities
-- ---------------------------------------------------------------------------
alter table public.opportunities enable row level security;

create policy "opportunities_select_published_or_own"
on public.opportunities
for select
to anon, authenticated
using (
  status = 'published'
  or auth.uid() = owner_id
  or public.is_admin(auth.uid())
);

create policy "opportunities_insert_own"
on public.opportunities
for insert
to authenticated
with check (auth.uid() = owner_id);

create policy "opportunities_update_own"
on public.opportunities
for update
to authenticated
using (
  auth.uid() = owner_id
  or public.is_admin(auth.uid())
)
with check (
  auth.uid() = owner_id
  or public.is_admin(auth.uid())
);

create policy "opportunities_delete_own"
on public.opportunities
for delete
to authenticated
using (
  auth.uid() = owner_id
  or public.is_admin(auth.uid())
);
