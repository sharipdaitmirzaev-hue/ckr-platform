-- ЦКР Этап 14: коммуникации и центр активности
-- Расширение notifications, activity_feed, доработка conversations/messages

-- ---------------------------------------------------------------------------
-- notifications: Stage 14 поля + совместимость
-- ---------------------------------------------------------------------------
alter table public.notifications
  add column if not exists message text not null default '',
  add column if not exists related_type text,
  add column if not exists related_id uuid,
  add column if not exists is_read boolean not null default false;

-- Перенос данных из body / read_at
update public.notifications
set message = body
where (message is null or message = '') and body is not null and body <> '';

update public.notifications
set is_read = true
where read_at is not null and is_read = false;

create index if not exists notifications_is_read_idx
  on public.notifications (user_id, is_read);

create index if not exists notifications_related_idx
  on public.notifications (related_type, related_id);

comment on column public.notifications.message is 'Текст уведомления (Stage 14); body сохранён для совместимости';
comment on column public.notifications.related_type is 'application | message | project | deal | document | verification | system';
comment on column public.notifications.is_read is 'Прочитано; синхронизируется с read_at';

-- Синхронизация message/body и is_read/read_at
create or replace function public.sync_notification_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(new.message, '') = '' and coalesce(new.body, '') <> '' then
      new.message := new.body;
    elsif coalesce(new.body, '') = '' and coalesce(new.message, '') <> '' then
      new.body := new.message;
    end if;
  else
    if new.message is distinct from old.message and coalesce(new.message, '') <> '' then
      new.body := new.message;
    elsif new.body is distinct from old.body and coalesce(new.message, '') = '' then
      new.message := new.body;
    end if;
  end if;

  if new.is_read is true then
    if new.read_at is null then
      new.read_at := now();
    end if;
  elsif new.read_at is not null then
    new.is_read := true;
  else
    new.is_read := false;
    new.read_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists notifications_sync_fields on public.notifications;
create trigger notifications_sync_fields
before insert or update on public.notifications
for each row
execute function public.sync_notification_fields();

-- Обновлённый RPC: сохраняем совместимость вызовов с 4–6 аргументами
drop function if exists public.create_notification(uuid, text, text, text, text, uuid);

create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link text default null,
  p_application_id uuid default null,
  p_related_type text default null,
  p_related_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    message,
    link,
    application_id,
    related_type,
    related_id,
    is_read
  ) values (
    p_user_id,
    p_type,
    p_title,
    coalesce(p_body, ''),
    coalesce(p_body, ''),
    p_link,
    p_application_id,
    coalesce(
      p_related_type,
      case
        when p_application_id is not null then 'application'
        else 'system'
      end
    ),
    coalesce(p_related_id, p_application_id)
  );
end;
$$;

revoke all on function public.create_notification(uuid, text, text, text, text, uuid, text, uuid) from public;
grant execute on function public.create_notification(uuid, text, text, text, text, uuid, text, uuid) to authenticated;

-- Триггер заявки: заполняем related_*
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

  insert into public.notifications (
    user_id, type, title, body, message, link,
    application_id, related_type, related_id, is_read
  )
  values (
    owner,
    'application',
    'Новая заявка',
    'Вам поступила заявка по ' || target_label || '.',
    'Вам поступила заявка по ' || target_label || '.',
    '/dashboard/applications',
    new.id,
    'application',
    new.id,
    false
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- activity_feed — персональная лента событий
-- ---------------------------------------------------------------------------
create table if not exists public.activity_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  action_type text not null,
  description text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_feed_user_id_idx
  on public.activity_feed (user_id, created_at desc);
create index if not exists activity_feed_project_id_idx
  on public.activity_feed (project_id);

comment on table public.activity_feed is
  'Персональная лента активности пользователя ЦКР';

alter table public.activity_feed enable row level security;

create policy "activity_feed_select_own"
on public.activity_feed
for select
to authenticated
using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "activity_feed_insert_own"
on public.activity_feed
for insert
to authenticated
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

-- RPC для сервисной записи активности (security definer)
create or replace function public.log_activity_feed(
  p_user_id uuid,
  p_action_type text,
  p_description text,
  p_project_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.activity_feed (
    user_id, project_id, action_type, description, metadata
  ) values (
    p_user_id, p_project_id, p_action_type, p_description, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.log_activity_feed(uuid, text, text, uuid, jsonb) from public;
grant execute on function public.log_activity_feed(uuid, text, text, uuid, jsonb) to authenticated;

-- При создании проекта — запись в activity_feed владельца
create or replace function public.log_project_created_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_feed (user_id, project_id, action_type, description, metadata)
  values (
    new.owner_id,
    new.id,
    'project_created',
    'Создан проект «' || new.title || '»',
    jsonb_build_object('status', new.status, 'stage', new.stage)
  );
  return new;
end;
$$;

drop trigger if exists on_project_created_activity on public.projects;
create trigger on_project_created_activity
after insert on public.projects
for each row
execute function public.log_project_created_activity();

-- Зеркалирование project_activity → activity_feed владельца проекта
create or replace function public.mirror_project_activity_to_feed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  select owner_id into owner from public.projects where id = new.project_id;
  if owner is null then
    return new;
  end if;

  insert into public.activity_feed (
    user_id, project_id, action_type, description, metadata
  ) values (
    owner,
    new.project_id,
    new.activity_type::text,
    coalesce(nullif(new.title, ''), new.body, 'Событие проекта'),
    coalesce(new.metadata, '{}'::jsonb) || jsonb_build_object(
      'actor_id', new.actor_id,
      'body', new.body
    )
  );

  return new;
end;
$$;

drop trigger if exists on_project_activity_mirror on public.project_activity;
create trigger on_project_activity_mirror
after insert on public.project_activity
for each row
execute function public.mirror_project_activity_to_feed();

-- ---------------------------------------------------------------------------
-- conversations: связь с проектом + метаданные
-- ---------------------------------------------------------------------------
alter table public.conversations
  add column if not exists project_id uuid references public.projects (id) on delete set null,
  add column if not exists title text not null default 'Диалог',
  add column if not exists updated_at timestamptz not null default now();

create index if not exists conversations_project_id_idx
  on public.conversations (project_id);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row
execute function public.set_updated_at();

-- При принятии заявки — проставить project_id и title
create or replace function public.ensure_conversation_on_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv_id uuid;
  owner uuid;
  conv_title text;
  proj_id uuid;
begin
  if new.status = 'accepted' and (old.status is distinct from 'accepted') then
    owner := public.get_application_target_owner(new.target_type, new.target_id);
    conv_title := 'Диалог по заявке';
    proj_id := null;

    if new.target_type = 'project' then
      proj_id := new.target_id;
      select 'Диалог: ' || title into conv_title from public.projects where id = new.target_id;
    end if;

    insert into public.conversations (application_id, project_id, title)
    values (new.id, proj_id, coalesce(conv_title, 'Диалог'))
    on conflict (application_id) do update
      set project_id = coalesce(excluded.project_id, public.conversations.project_id),
          title = coalesce(excluded.title, public.conversations.title),
          updated_at = now()
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

    -- Уведомление о новом диалоге
    if owner is not null then
      perform public.create_notification(
        new.from_user_id,
        'message',
        'Диалог открыт',
        'Заявка принята — можно переписываться.',
        '/messages?c=' || conv_id::text,
        new.id,
        'message',
        conv_id
      );
    end if;
  end if;

  return new;
end;
$$;

-- Уведомление собеседникам о новом сообщении + touch conversation
create or replace function public.notify_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member record;
  conv_title text;
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;

  select title into conv_title from public.conversations where id = new.conversation_id;

  for member in
    select user_id
    from public.conversation_members
    where conversation_id = new.conversation_id
      and user_id <> new.sender_id
  loop
    perform public.create_notification(
      member.user_id,
      'message',
      'Новое сообщение',
      left(coalesce(conv_title, 'Диалог') || ': ' || new.body, 200),
      '/messages?c=' || new.conversation_id::text,
      null,
      'message',
      new.conversation_id
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists on_message_created_notify on public.messages;
create trigger on_message_created_notify
after insert on public.messages
for each row
execute function public.notify_on_new_message();
