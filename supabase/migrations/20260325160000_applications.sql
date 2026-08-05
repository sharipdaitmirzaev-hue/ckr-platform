-- ЦКР Этап 4: applications + notifications + messages foundation

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.application_target_type as enum (
  'project',
  'opportunity',
  'investment',
  'expert'
);

create type public.application_status as enum (
  'new',
  'reviewing',
  'accepted',
  'rejected',
  'closed'
);

-- ---------------------------------------------------------------------------
-- applications (универсальные заявки)
-- ---------------------------------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.application_target_type not null,
  target_id uuid not null,
  message text not null default '',
  status public.application_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_from_user_id_idx on public.applications (from_user_id);
create index applications_target_idx on public.applications (target_type, target_id);
create index applications_status_idx on public.applications (status);

comment on table public.applications is 'Универсальные заявки ЦКР: project / opportunity / investment / expert';

create trigger applications_set_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

-- Владелец целевого объекта (для RLS и уведомлений)
create or replace function public.owns_application_target(
  p_target_type public.application_target_type,
  p_target_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_target_type = 'project' then
    return exists (
      select 1
      from public.projects
      where id = p_target_id
        and owner_id = auth.uid()
    );
  end if;

  if p_target_type = 'opportunity' then
    return exists (
      select 1
      from public.opportunities
      where id = p_target_id
        and owner_id = auth.uid()
    );
  end if;

  -- investment / expert — таблицы появятся позже
  return false;
end;
$$;

create or replace function public.get_application_target_owner(
  p_target_type public.application_target_type,
  p_target_id uuid
)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  if p_target_type = 'project' then
    select owner_id into owner from public.projects where id = p_target_id;
    return owner;
  end if;

  if p_target_type = 'opportunity' then
    select owner_id into owner from public.opportunities where id = p_target_id;
    return owner;
  end if;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- notifications (уведомления владельцу)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  link text,
  application_id uuid references public.applications (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_unread_idx on public.notifications (user_id, read_at);

comment on table public.notifications is 'In-app уведомления ЦКР';

-- Автоуведомление владельцу при новой заявке
create or replace function public.notify_on_new_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
  target_label text;
begin
  owner := public.get_application_target_owner(new.target_type, new.target_id);
  if owner is null or owner = new.from_user_id then
    return new;
  end if;

  target_label := case new.target_type
    when 'project' then 'проекту'
    when 'opportunity' then 'возможности'
    when 'investment' then 'инвестиционному предложению'
    when 'expert' then 'экспертной услуге'
    else 'объекту'
  end;

  insert into public.notifications (user_id, type, title, body, link, application_id)
  values (
    owner,
    'application_received',
    'Новая заявка',
    'Вам поступила заявка по ' || target_label || '.',
    '/dashboard/applications',
    new.id
  );

  return new;
end;
$$;

create trigger on_application_created_notify
after insert on public.applications
for each row
execute function public.notify_on_new_application();

-- ---------------------------------------------------------------------------
-- messages foundation (чат после принятия — UI позже)
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid unique references public.applications (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id);

comment on table public.conversations is 'Заготовка чата: создаётся после принятия заявки';
comment on table public.messages is 'Заготовка сообщений (UI на следующем этапе)';

-- При accepted — создать conversation + members
create or replace function public.ensure_conversation_on_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv_id uuid;
  owner uuid;
begin
  if new.status = 'accepted' and (old.status is distinct from 'accepted') then
    owner := public.get_application_target_owner(new.target_type, new.target_id);

    insert into public.conversations (application_id)
    values (new.id)
    on conflict (application_id) do update
      set application_id = excluded.application_id
    returning id into conv_id;

    if conv_id is null then
      select id into conv_id
      from public.conversations
      where application_id = new.id;
    end if;

    insert into public.conversation_members (conversation_id, user_id)
    values (conv_id, new.from_user_id)
    on conflict do nothing;

    if owner is not null then
      insert into public.conversation_members (conversation_id, user_id)
      values (conv_id, owner)
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

create trigger on_application_accepted_conversation
after update on public.applications
for each row
execute function public.ensure_conversation_on_accept();

-- ---------------------------------------------------------------------------
-- RLS: applications
-- ---------------------------------------------------------------------------
alter table public.applications enable row level security;

create policy "applications_select_own_or_target_owner"
on public.applications
for select
to authenticated
using (
  auth.uid() = from_user_id
  or public.owns_application_target(target_type, target_id)
  or public.is_admin(auth.uid())
);

create policy "applications_insert_own"
on public.applications
for insert
to authenticated
with check (
  auth.uid() = from_user_id
);

-- Отправитель не меняет статус чужой заявки; владелец/админ обновляют статус
create policy "applications_update_participants"
on public.applications
for update
to authenticated
using (
  auth.uid() = from_user_id
  or public.owns_application_target(target_type, target_id)
  or public.is_admin(auth.uid())
)
with check (
  auth.uid() = from_user_id
  or public.owns_application_target(target_type, target_id)
  or public.is_admin(auth.uid())
);

-- ---------------------------------------------------------------------------
-- RLS: notifications
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;

create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- insert выполняется security definer trigger'ом / RPC

create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link text default null,
  p_application_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    user_id, type, title, body, link, application_id
  ) values (
    p_user_id, p_type, p_title, p_body, p_link, p_application_id
  );
end;
$$;

revoke all on function public.create_notification(uuid, text, text, text, text, uuid) from public;
grant execute on function public.create_notification(uuid, text, text, text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: conversations / members / messages (основа)
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "conversations_select_member"
on public.conversations
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_members m
    where m.conversation_id = id
      and m.user_id = auth.uid()
  )
  or public.is_admin(auth.uid())
);

create policy "conversation_members_select_member"
on public.conversation_members
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_members m
    where m.conversation_id = conversation_id
      and m.user_id = auth.uid()
  )
  or public.is_admin(auth.uid())
);

create policy "messages_select_member"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_members m
    where m.conversation_id = conversation_id
      and m.user_id = auth.uid()
  )
  or public.is_admin(auth.uid())
);

create policy "messages_insert_member"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversation_members m
    where m.conversation_id = conversation_id
      and m.user_id = auth.uid()
  )
);
