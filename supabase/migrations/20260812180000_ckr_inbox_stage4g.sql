-- Stage 4G — CKR Inbox / Заявки (additive)
-- Does NOT replace marketplace applications or CRM leads.
-- Unifies org→CKR requests (e.g. partnerships) into an operator inbox.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.ckr_request_status AS ENUM (
    'NEW',
    'IN_REVIEW',
    'ACCEPTED',
    'IN_PROGRESS',
    'WAITING_CLIENT',
    'WAITING_EXTERNAL',
    'COMPLETED',
    'REJECTED',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ckr_request_priority AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ckr_request_type AS ENUM (
    'GENERAL',
    'INVESTMENT',
    'FIND_INVESTOR',
    'FIND_BUYER',
    'FIND_SUPPLIER',
    'FIND_PARTNER',
    'PROPERTY',
    'BUSINESS',
    'PROJECT',
    'PROCUREMENT',
    'SUPPORT',
    'EXPERT',
    'CKR_SERVICE',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ckr_request_source AS ENUM (
    'direct',
    'partnership',
    'marketplace_application',
    'verification',
    'need_profile',
    'manual',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ckr_comment_visibility AS ENUM (
    'INTERNAL',
    'CLIENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Optional: allow tasks to reference inbox items
DO $$ BEGIN
  ALTER TYPE public.task_related_type ADD VALUE IF NOT EXISTS 'ckr_request';
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- ckr_requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ckr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  request_type public.ckr_request_type NOT NULL DEFAULT 'GENERAL',
  status public.ckr_request_status NOT NULL DEFAULT 'NEW',
  priority public.ckr_request_priority NOT NULL DEFAULT 'NORMAL',
  source public.ckr_request_source NOT NULL DEFAULT 'direct',
  source_table text NOT NULL DEFAULT '',
  source_id uuid,
  organization_id uuid REFERENCES public.organizations (id) ON DELETE SET NULL,
  from_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  assigned_at timestamptz,
  need_profile_id uuid,
  deal_id uuid REFERENCES public.deals (id) ON DELETE SET NULL,
  linked_task_id uuid REFERENCES public.tasks (id) ON DELETE SET NULL,
  next_step_public text NOT NULL DEFAULT '',
  next_step_internal text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  lia_brief jsonb,
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_table, source_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ckr_requests_idempotency_uidx
  ON public.ckr_requests (from_user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

CREATE INDEX IF NOT EXISTS ckr_requests_status_idx ON public.ckr_requests (status);
CREATE INDEX IF NOT EXISTS ckr_requests_assigned_idx ON public.ckr_requests (assigned_to);
CREATE INDEX IF NOT EXISTS ckr_requests_org_idx ON public.ckr_requests (organization_id);
CREATE INDEX IF NOT EXISTS ckr_requests_from_user_idx ON public.ckr_requests (from_user_id);
CREATE INDEX IF NOT EXISTS ckr_requests_created_idx ON public.ckr_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS ckr_requests_type_idx ON public.ckr_requests (request_type);
CREATE INDEX IF NOT EXISTS ckr_requests_priority_idx ON public.ckr_requests (priority);

COMMENT ON TABLE public.ckr_requests IS
  'Stage 4G — единый inbox обращений в ЦКР (не marketplace applications)';

CREATE TRIGGER ckr_requests_set_updated_at
BEFORE UPDATE ON public.ckr_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- comments (INTERNAL = CKR only, CLIENT = visible to applicant)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ckr_request_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL
    REFERENCES public.ckr_requests (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  visibility public.ckr_comment_visibility NOT NULL DEFAULT 'INTERNAL',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ckr_request_comments_req_idx
  ON public.ckr_request_comments (request_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- timeline events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ckr_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL
    REFERENCES public.ckr_requests (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL DEFAULT '',
  detail text NOT NULL DEFAULT '',
  visibility public.ckr_comment_visibility NOT NULL DEFAULT 'INTERNAL',
  actor_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ckr_request_events_req_idx
  ON public.ckr_request_events (request_id, created_at DESC);

-- Optional link from deals
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS ckr_request_id uuid
    REFERENCES public.ckr_requests (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS deals_ckr_request_id_idx
  ON public.deals (ckr_request_id)
  WHERE ckr_request_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_ckr_request(req_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin(uid)
    OR EXISTS (
      SELECT 1 FROM public.operator_roles o
      WHERE o.user_id = uid AND o.active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.ckr_requests r
      WHERE r.id = req_id
        AND (
          r.from_user_id = uid
          OR (
            r.organization_id IS NOT NULL
            AND public.is_org_member(r.organization_id, uid)
          )
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_ckr_inbox(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin(uid)
    OR EXISTS (
      SELECT 1 FROM public.operator_roles o
      WHERE o.user_id = uid AND o.active = true
    );
$$;

REVOKE ALL ON FUNCTION public.can_access_ckr_request(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_access_ckr_request(uuid, uuid)
  TO authenticated, anon, service_role;

REVOKE ALL ON FUNCTION public.can_manage_ckr_inbox(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_manage_ckr_inbox(uuid)
  TO authenticated, anon, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.ckr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ckr_request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ckr_request_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ckr_requests_select ON public.ckr_requests;
CREATE POLICY ckr_requests_select
ON public.ckr_requests
FOR SELECT
TO authenticated
USING (public.can_access_ckr_request(id, auth.uid()));

DROP POLICY IF EXISTS ckr_requests_insert ON public.ckr_requests;
CREATE POLICY ckr_requests_insert
ON public.ckr_requests
FOR INSERT
TO authenticated
WITH CHECK (
  from_user_id = auth.uid()
  OR public.can_manage_ckr_inbox(auth.uid())
);

DROP POLICY IF EXISTS ckr_requests_update ON public.ckr_requests;
CREATE POLICY ckr_requests_update
ON public.ckr_requests
FOR UPDATE
TO authenticated
USING (
  public.can_manage_ckr_inbox(auth.uid())
  OR from_user_id = auth.uid()
)
WITH CHECK (
  public.can_manage_ckr_inbox(auth.uid())
  OR from_user_id = auth.uid()
);

-- comments
DROP POLICY IF EXISTS ckr_request_comments_select ON public.ckr_request_comments;
CREATE POLICY ckr_request_comments_select
ON public.ckr_request_comments
FOR SELECT
TO authenticated
USING (
  public.can_manage_ckr_inbox(auth.uid())
  OR (
    visibility = 'CLIENT'
    AND public.can_access_ckr_request(request_id, auth.uid())
  )
);

DROP POLICY IF EXISTS ckr_request_comments_insert ON public.ckr_request_comments;
CREATE POLICY ckr_request_comments_insert
ON public.ckr_request_comments
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND (
    public.can_manage_ckr_inbox(auth.uid())
    OR (
      visibility = 'CLIENT'
      AND public.can_access_ckr_request(request_id, auth.uid())
    )
  )
);

-- events
DROP POLICY IF EXISTS ckr_request_events_select ON public.ckr_request_events;
CREATE POLICY ckr_request_events_select
ON public.ckr_request_events
FOR SELECT
TO authenticated
USING (
  public.can_manage_ckr_inbox(auth.uid())
  OR (
    visibility = 'CLIENT'
    AND public.can_access_ckr_request(request_id, auth.uid())
  )
);

DROP POLICY IF EXISTS ckr_request_events_insert ON public.ckr_request_events;
CREATE POLICY ckr_request_events_insert
ON public.ckr_request_events
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_manage_ckr_inbox(auth.uid())
  OR public.can_access_ckr_request(request_id, auth.uid())
);

-- ---------------------------------------------------------------------------
-- Import helper: partnership → ckr_request (idempotent via source unique)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_ckr_request_from_partnership(p_partnership_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p record;
  v_id uuid;
  v_type public.ckr_request_type;
BEGIN
  SELECT * INTO p FROM public.partnerships WHERE id = p_partnership_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'partnership not found';
  END IF;
  IF p.created_by IS NULL THEN
    RAISE EXCEPTION 'partnership has no created_by';
  END IF;

  SELECT id INTO v_id
  FROM public.ckr_requests
  WHERE source_table = 'partnerships' AND source_id = p.id;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  v_type := CASE p.type
    WHEN 'supplier' THEN 'FIND_BUYER'::public.ckr_request_type
    WHEN 'investment' THEN 'INVESTMENT'::public.ckr_request_type
    WHEN 'expert' THEN 'EXPERT'::public.ckr_request_type
    WHEN 'technology' THEN 'FIND_PARTNER'::public.ckr_request_type
    ELSE 'FIND_PARTNER'::public.ckr_request_type
  END;

  INSERT INTO public.ckr_requests (
    subject,
    body,
    request_type,
    status,
    priority,
    source,
    source_table,
    source_id,
    organization_id,
    from_user_id,
    region
  )
  VALUES (
    'Партнёрство · ' || p.type::text,
    coalesce(p.description, ''),
    v_type,
    'NEW',
    'NORMAL',
    'partnership',
    'partnerships',
    p.id,
    p.organization_id,
    p.created_by,
    coalesce((SELECT o.region FROM public.organizations o WHERE o.id = p.organization_id), '')
  )
  RETURNING id INTO v_id;

  INSERT INTO public.ckr_request_events (
    request_id, event_type, title, detail, visibility, actor_user_id, meta
  ) VALUES (
    v_id,
    'APPLICATION_CREATED',
    'Заявка импортирована из партнёрства',
    left(coalesce(p.description, ''), 240),
    'CLIENT',
    p.created_by,
    jsonb_build_object('partnership_id', p.id)
  );

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_ckr_request_from_partnership(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.ensure_ckr_request_from_partnership(uuid)
  TO authenticated, service_role;
