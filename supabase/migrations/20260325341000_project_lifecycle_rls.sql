-- ЦКР Этап 25: RLS каталога после расширения project_status
-- (отдельная миграция: новые enum values должны быть закоммичены)

drop policy if exists "projects_select_published_or_own" on public.projects;
create policy "projects_select_published_or_own"
on public.projects
for select
to anon, authenticated
using (
  status in ('published', 'active', 'completed')
  or auth.uid() = owner_id
  or public.is_admin(auth.uid())
);
