-- ЦКР Этап 2: categories + projects (ядро платформы)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.project_status as enum (
  'draft',
  'moderation',
  'published',
  'archived'
);

create type public.project_stage as enum (
  'idea',
  'startup',
  'operating',
  'expansion'
);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create index categories_slug_idx on public.categories (slug);

comment on table public.categories is 'Отраслевые категории проектов ЦКР';

insert into public.categories (name, icon, slug) values
  ('Производство', 'factory', 'production'),
  ('Недвижимость', 'building', 'real-estate'),
  ('Сельское хозяйство', 'sprout', 'agriculture'),
  ('Туризм', 'map', 'tourism'),
  ('IT', 'cpu', 'it'),
  ('Торговля', 'store', 'trade'),
  ('Услуги', 'briefcase', 'services'),
  ('Энергетика', 'zap', 'energy');

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  slug text not null unique,
  summary text not null default '',
  description text not null default '',
  category text not null references public.categories (slug),
  region text not null default '',
  investment_required numeric(18, 2) not null default 0,
  currency text not null default 'RUB',
  stage public.project_stage not null default 'idea',
  status public.project_status not null default 'draft',
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_owner_id_idx on public.projects (owner_id);
create index projects_status_idx on public.projects (status);
create index projects_category_idx on public.projects (category);
create index projects_region_idx on public.projects (region);
create index projects_stage_idx on public.projects (stage);

comment on table public.projects is 'Центральная сущность ЦКР — бизнес-проект';

create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: categories — публичное чтение
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;

create policy "categories_select_all"
on public.categories
for select
to anon, authenticated
using (true);

-- ---------------------------------------------------------------------------
-- RLS: projects
-- Владелец: create / read / update своих
-- Гость и остальные: только published
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;

create policy "projects_select_published_or_own"
on public.projects
for select
to anon, authenticated
using (
  status = 'published'
  or auth.uid() = owner_id
  or public.is_admin(auth.uid())
);

create policy "projects_insert_own"
on public.projects
for insert
to authenticated
with check (
  auth.uid() = owner_id
);

create policy "projects_update_own"
on public.projects
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

create policy "projects_delete_own"
on public.projects
for delete
to authenticated
using (
  auth.uid() = owner_id
  or public.is_admin(auth.uid())
);
