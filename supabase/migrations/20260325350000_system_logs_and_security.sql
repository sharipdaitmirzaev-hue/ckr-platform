-- ЦКР Этап 26: system_logs + ужесточение SECURITY DEFINER RPC

-- ---------------------------------------------------------------------------
-- system_logs
-- ---------------------------------------------------------------------------
create type public.system_log_level as enum (
  'info',
  'warning',
  'error'
);

create table public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level public.system_log_level not null default 'info',
  source text not null default 'app',
  message text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index system_logs_created_at_idx
  on public.system_logs (created_at desc);
create index system_logs_level_idx
  on public.system_logs (level, created_at desc);
create index system_logs_source_idx
  on public.system_logs (source, created_at desc);

comment on table public.system_logs is
  'Операционные логи ЦКР: API ошибки, важные действия, системные события';

alter table public.system_logs enable row level security;

-- Чтение — только admin / operator
drop policy if exists "system_logs_select_ops" on public.system_logs;
create policy "system_logs_select_ops"
on public.system_logs
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or public.is_operator(auth.uid())
);

-- Insert через RPC (security definer); прямой insert только admin
drop policy if exists "system_logs_insert_admin" on public.system_logs;
create policy "system_logs_insert_admin"
on public.system_logs
for insert
to authenticated
with check (public.is_admin(auth.uid()));

create or replace function public.write_system_log(
  p_level text,
  p_source text,
  p_message text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  lvl public.system_log_level;
begin
  lvl := case lower(coalesce(p_level, 'info'))
    when 'warning' then 'warning'::public.system_log_level
    when 'error' then 'error'::public.system_log_level
    else 'info'::public.system_log_level
  end;

  insert into public.system_logs (level, source, message, metadata)
  values (
    lvl,
    coalesce(nullif(trim(p_source), ''), 'app'),
    coalesce(p_message, ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.write_system_log(text, text, text, jsonb) from public;
grant execute on function public.write_system_log(text, text, text, jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Ужесточение create_notification
-- ---------------------------------------------------------------------------
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
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- Self / admin / operator — всегда;
  -- иначе бизнес-типы только с application_id или related_id (снижает спам)
  if not (
    p_user_id = auth.uid()
    or public.is_admin(auth.uid())
    or public.is_operator(auth.uid())
    or (
      p_type in (
        'application_status',
        'application',
        'deal_update',
        'message',
        'project_update',
        'document',
        'verification'
      )
      and (p_related_id is not null or p_application_id is not null)
    )
  ) then
    raise exception 'notification forbidden';
  end if;

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

-- ---------------------------------------------------------------------------
-- Ужесточение log_activity_feed — только себе или admin
-- ---------------------------------------------------------------------------
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
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_user_id <> auth.uid() and not public.is_admin(auth.uid()) then
    raise exception 'activity feed forbidden';
  end if;

  insert into public.activity_feed (
    user_id, project_id, action_type, description, metadata
  ) values (
    p_user_id, p_project_id, p_action_type, p_description, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into new_id;
  return new_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Индекс каталога проектов (performance)
-- ---------------------------------------------------------------------------
create index if not exists projects_status_created_at_idx
  on public.projects (status, created_at desc);
