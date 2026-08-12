-- Stage 4K hotfix — protect client-facing owner fields from non-staff UPDATE.
-- Pre-existing ckr_requests_update allowed from_user_id to PATCH any column.
-- Additive trigger only; does not change SELECT/INSERT policies.

CREATE OR REPLACE FUNCTION public.ckr_requests_protect_owner_cabinet_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- service role / SQL console: auth.uid() is null
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.can_manage_ckr_inbox(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.public_activity_text IS DISTINCT FROM OLD.public_activity_text THEN
    RAISE EXCEPTION 'public_activity_text: only CKR staff can update';
  END IF;

  IF NEW.next_step_public IS DISTINCT FROM OLD.next_step_public THEN
    RAISE EXCEPTION 'next_step_public: only CKR staff can update';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'status: only CKR staff can update';
  END IF;

  IF NEW.priority IS DISTINCT FROM OLD.priority THEN
    RAISE EXCEPTION 'priority: only CKR staff can update';
  END IF;

  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    RAISE EXCEPTION 'assigned_to: only CKR staff can update';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ckr_requests_protect_owner_cabinet_fields
  ON public.ckr_requests;

CREATE TRIGGER ckr_requests_protect_owner_cabinet_fields
BEFORE UPDATE ON public.ckr_requests
FOR EACH ROW
EXECUTE FUNCTION public.ckr_requests_protect_owner_cabinet_fields();

COMMENT ON FUNCTION public.ckr_requests_protect_owner_cabinet_fields() IS
  'Stage 4K — block non-staff changes to public cabinet control fields';
