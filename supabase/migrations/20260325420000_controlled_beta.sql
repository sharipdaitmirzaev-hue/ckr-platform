-- ЦКР Этап 38: Controlled Beta — статусы участия и политика доступа

-- Новые статусы участия (совместимы с created/sent/used/expired)
alter type public.beta_invite_status add value if not exists 'invited';
alter type public.beta_invite_status add value if not exists 'activated';
alter type public.beta_invite_status add value if not exists 'completed';
alter type public.beta_invite_status add value if not exists 'disabled';

comment on type public.beta_invite_status is
  'Статусы beta: invited/activated/completed/disabled (+ legacy created/sent/used/expired)';

-- RLS: регистрация по invited (+ legacy created/sent)
drop policy if exists "beta_invites_select_by_code" on public.beta_invites;
create policy "beta_invites_select_by_code"
on public.beta_invites
for select
to anon, authenticated
using (status in ('created', 'sent', 'invited'));

drop policy if exists "beta_invites_update_use" on public.beta_invites;
create policy "beta_invites_update_use"
on public.beta_invites
for update
to authenticated
using (status in ('created', 'sent', 'invited'))
with check (status in ('used', 'activated'));
