-- ЦКР Этап 9: Лия — сессии и сообщения ИИ-навигатора

create type public.lia_message_role as enum (
  'user',
  'assistant',
  'system',
  'tool'
);

create table public.lia_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Новый диалог',
  context_type text,
  context_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lia_sessions_user_id_idx on public.lia_sessions (user_id);
create index lia_sessions_updated_at_idx on public.lia_sessions (updated_at desc);

comment on table public.lia_sessions is 'Диалоги пользователя с ИИ-навигатором Лия';

create trigger lia_sessions_set_updated_at
before update on public.lia_sessions
for each row
execute function public.set_updated_at();

create table public.lia_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.lia_sessions (id) on delete cascade,
  role public.lia_message_role not null,
  content text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index lia_messages_session_id_idx on public.lia_messages (session_id);
create index lia_messages_created_at_idx on public.lia_messages (created_at);

comment on table public.lia_messages is 'Сообщения диалогов Лии';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.lia_sessions enable row level security;
alter table public.lia_messages enable row level security;

create policy "lia_sessions_select_own"
on public.lia_sessions
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);

create policy "lia_sessions_insert_own"
on public.lia_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "lia_sessions_update_own"
on public.lia_sessions
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

create policy "lia_sessions_delete_own"
on public.lia_sessions
for delete
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);

create policy "lia_messages_select_own"
on public.lia_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.lia_sessions s
    where s.id = session_id
      and (s.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

create policy "lia_messages_insert_own"
on public.lia_messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.lia_sessions s
    where s.id = session_id
      and s.user_id = auth.uid()
  )
);

create policy "lia_messages_update_own"
on public.lia_messages
for update
to authenticated
using (
  exists (
    select 1
    from public.lia_sessions s
    where s.id = session_id
      and (s.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
)
with check (
  exists (
    select 1
    from public.lia_sessions s
    where s.id = session_id
      and (s.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

create policy "lia_messages_delete_own"
on public.lia_messages
for delete
to authenticated
using (
  exists (
    select 1
    from public.lia_sessions s
    where s.id = session_id
      and (s.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);
