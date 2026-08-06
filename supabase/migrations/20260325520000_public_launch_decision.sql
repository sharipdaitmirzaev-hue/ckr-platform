-- ЦКР Этап 57: Public Launch Decision Gate

create type public.public_launch_decision_kind as enum (
  'public_launch',
  'continue_beta',
  'improve_product'
);

create table public.public_launch_decisions (
  id uuid primary key default gen_random_uuid(),
  wave_id uuid references public.launch_waves (id) on delete set null,
  decision public.public_launch_decision_kind not null,
  notes text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index public_launch_decisions_wave_id_idx
  on public.public_launch_decisions (wave_id);
create index public_launch_decisions_created_at_idx
  on public.public_launch_decisions (created_at desc);

comment on table public.public_launch_decisions is
  'Решения Decision Gate перед Public Launch (этап 57)';

alter table public.public_launch_decisions enable row level security;

create policy "public_launch_decisions_staff_all"
on public.public_launch_decisions
for all
to authenticated
using (
  public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
)
with check (
  public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
);
