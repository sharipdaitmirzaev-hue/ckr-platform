-- Stage 4Q — Собственные идеи ЦКР (OWNER_ONLY analytic SoT).
-- Additive. No DROP. Not a marketplace project. RLS: admin only.

create table if not exists public.ckr_own_ideas (
  id uuid primary key,
  title text not null,
  essence text not null default '',
  why_noticed text not null default '',
  rating text not null,
  owner_state text not null default 'REVIEW',
  visibility text not null default 'OWNER_ONLY',
  components jsonb not null default '[]'::jsonb,
  missing jsonb not null default '[]'::jsonb,
  economics jsonb not null default '{}'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  next_checks jsonb not null default '[]'::jsonb,
  fingerprint text not null,
  owner_locked_fields jsonb not null default '[]'::jsonb,
  project_id text null,
  run_id uuid not null,
  marker text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  events jsonb not null default '[]'::jsonb,
  constraint ckr_own_ideas_visibility_owner_only check (visibility = 'OWNER_ONLY')
);

create index if not exists ckr_own_ideas_fingerprint_idx
  on public.ckr_own_ideas (fingerprint);
create index if not exists ckr_own_ideas_run_idx
  on public.ckr_own_ideas (run_id);

create table if not exists public.ckr_own_idea_runs (
  id uuid primary key,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  duration_ms integer not null default 0,
  metrics jsonb not null default '{}'::jsonb
);

alter table public.ckr_own_ideas enable row level security;
alter table public.ckr_own_idea_runs enable row level security;

drop policy if exists ckr_own_ideas_admin_all on public.ckr_own_ideas;
create policy ckr_own_ideas_admin_all
  on public.ckr_own_ideas
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists ckr_own_idea_runs_admin_all on public.ckr_own_idea_runs;
create policy ckr_own_idea_runs_admin_all
  on public.ckr_own_idea_runs
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

comment on table public.ckr_own_ideas is
  'Stage 4Q owner-only CKR own ideas. Not published. Not Matching. Not Scheduler.';
