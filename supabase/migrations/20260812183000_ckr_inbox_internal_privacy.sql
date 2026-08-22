-- Stage 4G follow-up: move LIA brief / internal next step to staff-only table
-- Additive. Clears sensitive fields from shared ckr_requests row (client-visible via RLS).

CREATE TABLE IF NOT EXISTS public.ckr_request_internal (
  request_id uuid PRIMARY KEY
    REFERENCES public.ckr_requests (id) ON DELETE CASCADE,
  lia_brief jsonb,
  next_step_internal text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ckr_request_internal IS
  'CKR_ONLY inbox fields (LIA brief, internal next step). Clients must not read.';

CREATE TRIGGER ckr_request_internal_set_updated_at
BEFORE UPDATE ON public.ckr_request_internal
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ckr_request_internal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ckr_request_internal_select ON public.ckr_request_internal;
CREATE POLICY ckr_request_internal_select
ON public.ckr_request_internal
FOR SELECT
TO authenticated
USING (public.can_manage_ckr_inbox(auth.uid()));

DROP POLICY IF EXISTS ckr_request_internal_insert ON public.ckr_request_internal;
CREATE POLICY ckr_request_internal_insert
ON public.ckr_request_internal
FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_ckr_inbox(auth.uid()));

DROP POLICY IF EXISTS ckr_request_internal_update ON public.ckr_request_internal;
CREATE POLICY ckr_request_internal_update
ON public.ckr_request_internal
FOR UPDATE
TO authenticated
USING (public.can_manage_ckr_inbox(auth.uid()))
WITH CHECK (public.can_manage_ckr_inbox(auth.uid()));

-- Move any existing values then clear shared columns
INSERT INTO public.ckr_request_internal (request_id, lia_brief, next_step_internal)
SELECT id, lia_brief, coalesce(next_step_internal, '')
FROM public.ckr_requests
WHERE lia_brief IS NOT NULL OR coalesce(next_step_internal, '') <> ''
ON CONFLICT (request_id) DO UPDATE
SET
  lia_brief = coalesce(EXCLUDED.lia_brief, public.ckr_request_internal.lia_brief),
  next_step_internal = CASE
    WHEN EXCLUDED.next_step_internal <> '' THEN EXCLUDED.next_step_internal
    ELSE public.ckr_request_internal.next_step_internal
  END,
  updated_at = now();

UPDATE public.ckr_requests
SET lia_brief = NULL,
    next_step_internal = '';

NOTIFY pgrst, 'reload schema';
