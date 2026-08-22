-- Stage 4K hotfix — create_notification VALUES missed is_read (production INSERT error).
-- Also allow type ckr_request for inbox notifications when related_id is present.

CREATE OR REPLACE FUNCTION public.create_notification(
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
        'verification',
        'ckr_request'
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
    coalesce(p_related_id, p_application_id),
    false
  );
end;
$$;
