-- ЦКР Этап 24: Репутация и доверие

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.reputation_entity_type as enum (
  'user',
  'organization'
);

create type public.reputation_verification_level as enum (
  'basic',
  'verified',
  'trusted'
);

create type public.review_target_type as enum (
  'project',
  'organization',
  'expert',
  'investor',
  'service'
);

create type public.entity_history_kind as enum (
  'project',
  'deal',
  'partnership',
  'task'
);

create type public.trust_badge_key as enum (
  'verified',
  'trusted_partner',
  'experienced_investor',
  'ckr_expert'
);

-- ---------------------------------------------------------------------------
-- reputation_profiles
-- ---------------------------------------------------------------------------
create table public.reputation_profiles (
  id uuid primary key default gen_random_uuid(),
  entity_type public.reputation_entity_type not null,
  entity_id uuid not null,
  score numeric(5, 2) not null default 0
    check (score >= 0 and score <= 5),
  verification_level public.reputation_verification_level
    not null default 'basic',
  completed_projects integer not null default 0 check (completed_projects >= 0),
  completed_deals integer not null default 0 check (completed_deals >= 0),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id)
);

create index reputation_profiles_entity_idx
  on public.reputation_profiles (entity_type, entity_id);
create index reputation_profiles_score_idx
  on public.reputation_profiles (score desc);

comment on table public.reputation_profiles is
  'Репутационные профили участников и организаций ЦКР';

create trigger reputation_profiles_set_updated_at
before update on public.reputation_profiles
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.review_target_type not null,
  target_id uuid not null,
  deal_id uuid references public.deals (id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index reviews_target_idx on public.reviews (target_type, target_id);
create index reviews_author_idx on public.reviews (author_id);
create index reviews_deal_idx on public.reviews (deal_id);
create index reviews_created_at_idx on public.reviews (created_at desc);

comment on table public.reviews is
  'Отзывы участников ЦКР о проектах, организациях, экспертах и услугах';

-- Один автор — один отзыв на цель (без дублей)
create unique index reviews_author_target_uidx
  on public.reviews (author_id, target_type, target_id);

-- ---------------------------------------------------------------------------
-- entity_history
-- ---------------------------------------------------------------------------
create table public.entity_history (
  id uuid primary key default gen_random_uuid(),
  entity_type public.reputation_entity_type not null,
  entity_id uuid not null,
  kind public.entity_history_kind not null,
  title text not null default '',
  related_type text,
  related_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index entity_history_entity_idx
  on public.entity_history (entity_type, entity_id, created_at desc);
create index entity_history_kind_idx on public.entity_history (kind);

comment on table public.entity_history is
  'История участия: проекты, сделки, партнёрства, завершённые задачи';

-- ---------------------------------------------------------------------------
-- trust_badges (выданные бейджи)
-- ---------------------------------------------------------------------------
create table public.trust_badges (
  id uuid primary key default gen_random_uuid(),
  entity_type public.reputation_entity_type not null,
  entity_id uuid not null,
  badge public.trust_badge_key not null,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, badge)
);

create index trust_badges_entity_idx
  on public.trust_badges (entity_type, entity_id);

comment on table public.trust_badges is
  'Бейджи доверия ЦКР: verified, trusted_partner, experienced_investor, ckr_expert';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.reputation_profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.entity_history enable row level security;
alter table public.trust_badges enable row level security;

-- reputation_profiles: публичное чтение; запись — admin / self (user)
drop policy if exists "reputation_profiles_select" on public.reputation_profiles;
create policy "reputation_profiles_select"
on public.reputation_profiles
for select
to anon, authenticated
using (true);

drop policy if exists "reputation_profiles_insert" on public.reputation_profiles;
create policy "reputation_profiles_insert"
on public.reputation_profiles
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
  or (entity_type = 'user' and entity_id = auth.uid())
);

drop policy if exists "reputation_profiles_update" on public.reputation_profiles;
create policy "reputation_profiles_update"
on public.reputation_profiles
for update
to authenticated
using (
  public.is_admin(auth.uid())
  or (entity_type = 'user' and entity_id = auth.uid())
)
with check (
  public.is_admin(auth.uid())
  or (entity_type = 'user' and entity_id = auth.uid())
);

-- reviews: публичное чтение; автор создаёт свой отзыв
drop policy if exists "reviews_select" on public.reviews;
create policy "reviews_select"
on public.reviews
for select
to anon, authenticated
using (true);

drop policy if exists "reviews_insert" on public.reviews;
create policy "reviews_insert"
on public.reviews
for insert
to authenticated
with check (auth.uid() = author_id);

drop policy if exists "reviews_update_own_or_admin" on public.reviews;
create policy "reviews_update_own_or_admin"
on public.reviews
for update
to authenticated
using (auth.uid() = author_id or public.is_admin(auth.uid()))
with check (auth.uid() = author_id or public.is_admin(auth.uid()));

drop policy if exists "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin"
on public.reviews
for delete
to authenticated
using (auth.uid() = author_id or public.is_admin(auth.uid()));

-- entity_history: публичное чтение; запись authenticated (серверные actions)
drop policy if exists "entity_history_select" on public.entity_history;
create policy "entity_history_select"
on public.entity_history
for select
to anon, authenticated
using (true);

drop policy if exists "entity_history_insert" on public.entity_history;
create policy "entity_history_insert"
on public.entity_history
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
  or (entity_type = 'user' and entity_id = auth.uid())
  or public.is_operator(auth.uid())
);

-- trust_badges: публичное чтение; авто-бейджи себе; полный доступ — admin
drop policy if exists "trust_badges_select" on public.trust_badges;
create policy "trust_badges_select"
on public.trust_badges
for select
to anon, authenticated
using (true);

drop policy if exists "trust_badges_self_insert" on public.trust_badges;
create policy "trust_badges_self_insert"
on public.trust_badges
for insert
to authenticated
with check (
  entity_type = 'user'
  and entity_id = auth.uid()
  and badge in ('verified', 'experienced_investor')
);

drop policy if exists "trust_badges_admin_all" on public.trust_badges;
create policy "trust_badges_admin_all"
on public.trust_badges
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
