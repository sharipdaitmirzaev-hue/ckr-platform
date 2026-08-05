-- ЦКР Этап 7: documents + verification_requests + entity verification_status + Storage

-- ---------------------------------------------------------------------------
-- verification_status на сущностях (enum уже есть с Этапа 6)
-- ---------------------------------------------------------------------------
alter table public.projects
  add column if not exists verification_status public.verification_status
    not null default 'unverified';

alter table public.opportunities
  add column if not exists verification_status public.verification_status
    not null default 'unverified';

alter table public.investment_offers
  add column if not exists verification_status public.verification_status
    not null default 'unverified';

alter table public.expert_profiles
  add column if not exists verification_status public.verification_status
    not null default 'unverified';

comment on column public.projects.verification_status is 'Статус проверки проекта ЦКР';
comment on column public.opportunities.verification_status is 'Статус проверки возможности ЦКР';
comment on column public.investment_offers.verification_status is 'Статус проверки инвестиционного предложения';
comment on column public.expert_profiles.verification_status is 'Статус проверки профиля эксперта';

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
create type public.document_related_type as enum (
  'profile',
  'project',
  'opportunity',
  'investment',
  'expert'
);

create type public.document_type as enum (
  'business_plan',
  'presentation',
  'company_document',
  'ownership_document',
  'license',
  'certificate',
  'financial',
  'other'
);

create type public.document_visibility as enum (
  'private',
  'review',
  'public'
);

create type public.document_status as enum (
  'uploaded',
  'pending',
  'verified',
  'rejected'
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  related_type public.document_related_type not null,
  related_id uuid not null,
  name text not null,
  document_type public.document_type not null default 'other',
  file_url text not null,
  visibility public.document_visibility not null default 'private',
  status public.document_status not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_owner_id_idx on public.documents (owner_id);
create index documents_related_idx on public.documents (related_type, related_id);
create index documents_status_idx on public.documents (status);
create index documents_visibility_idx on public.documents (visibility);

comment on table public.documents is 'Документы участников для системы доверия ЦКР';

create trigger documents_set_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- verification_requests
-- ---------------------------------------------------------------------------
create type public.verification_request_status as enum (
  'pending',
  'approved',
  'rejected'
);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.document_related_type not null,
  target_id uuid not null,
  status public.verification_request_status not null default 'pending',
  admin_comment text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index verification_requests_user_id_idx on public.verification_requests (user_id);
create index verification_requests_status_idx on public.verification_requests (status);
create index verification_requests_target_idx
  on public.verification_requests (target_type, target_id);

comment on table public.verification_requests is 'Заявки на проверку профилей и сущностей ЦКР';

create trigger verification_requests_set_updated_at
before update on public.verification_requests
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper: установить verification_status цели
-- ---------------------------------------------------------------------------
create or replace function public.set_target_verification_status(
  p_target_type public.document_related_type,
  p_target_id uuid,
  p_status public.verification_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_target_type = 'profile' then
    update public.profiles
    set verification_status = p_status
    where id = p_target_id;
  elsif p_target_type = 'project' then
    update public.projects
    set verification_status = p_status
    where id = p_target_id;
  elsif p_target_type = 'opportunity' then
    update public.opportunities
    set verification_status = p_status
    where id = p_target_id;
  elsif p_target_type = 'investment' then
    update public.investment_offers
    set verification_status = p_status
    where id = p_target_id;
  elsif p_target_type = 'expert' then
    update public.expert_profiles
    set verification_status = p_status
    where id = p_target_id;
  end if;
end;
$$;

-- Владелец цели заявки на проверку
create or replace function public.owns_verification_target(
  p_target_type public.document_related_type,
  p_target_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_target_type = 'profile' then
    return p_target_id = auth.uid();
  end if;

  if p_target_type = 'project' then
    return exists (
      select 1 from public.projects
      where id = p_target_id and owner_id = auth.uid()
    );
  end if;

  if p_target_type = 'opportunity' then
    return exists (
      select 1 from public.opportunities
      where id = p_target_id and owner_id = auth.uid()
    );
  end if;

  if p_target_type = 'investment' then
    return exists (
      select 1 from public.investment_offers
      where id = p_target_id and owner_id = auth.uid()
    );
  end if;

  if p_target_type = 'expert' then
    return exists (
      select 1 from public.expert_profiles
      where id = p_target_id and user_id = auth.uid()
    );
  end if;

  return false;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS: documents
-- ---------------------------------------------------------------------------
alter table public.documents enable row level security;

create policy "documents_select_own_admin_or_public"
on public.documents
for select
to anon, authenticated
using (
  auth.uid() = owner_id
  or public.is_admin(auth.uid())
  or (visibility = 'public' and status = 'verified')
);

create policy "documents_insert_own"
on public.documents
for insert
to authenticated
with check (auth.uid() = owner_id);

create policy "documents_update_own_or_admin"
on public.documents
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

create policy "documents_delete_own_or_admin"
on public.documents
for delete
to authenticated
using (
  auth.uid() = owner_id
  or public.is_admin(auth.uid())
);

-- ---------------------------------------------------------------------------
-- RLS: verification_requests
-- ---------------------------------------------------------------------------
alter table public.verification_requests enable row level security;

create policy "verification_requests_select_own_or_admin"
on public.verification_requests
for select
to authenticated
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);

create policy "verification_requests_insert_own"
on public.verification_requests
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.owns_verification_target(target_type, target_id)
);

create policy "verification_requests_update_admin"
on public.verification_requests
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "verification_requests_delete_admin"
on public.verification_requests
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage bucket: documents
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Путь: {user_id}/{related_type}/{related_id}/{filename}
create policy "documents_storage_select_own_or_admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin(auth.uid())
  )
);

create policy "documents_storage_select_public_verified"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.documents d
    where d.file_url = name
      and d.visibility = 'public'
      and d.status = 'verified'
  )
);

create policy "documents_storage_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "documents_storage_update_own_or_admin"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin(auth.uid())
  )
)
with check (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin(auth.uid())
  )
);

create policy "documents_storage_delete_own_or_admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin(auth.uid())
  )
);
