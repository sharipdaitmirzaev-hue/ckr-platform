-- Stage 4H — Public IDEA submission + claim + anonymous contacts (additive)
-- Does NOT weaken client SELECT of private requests.
-- Public writes only via SECURITY DEFINER RPCs below.

-- ---------------------------------------------------------------------------
-- Enum extensions
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TYPE public.ckr_request_type ADD VALUE IF NOT EXISTS 'IDEA';
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.ckr_request_source ADD VALUE IF NOT EXISTS 'public_idea_form';
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Anonymous / contact / claim columns on ckr_requests
-- ---------------------------------------------------------------------------
ALTER TABLE public.ckr_requests
  ALTER COLUMN from_user_id DROP NOT NULL;

ALTER TABLE public.ckr_requests
  ADD COLUMN IF NOT EXISTS contact_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_telegram text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS claim_token_hash text,
  ADD COLUMN IF NOT EXISTS claim_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS submitter_ip_hash text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS ckr_requests_claim_hash_idx
  ON public.ckr_requests (claim_token_hash)
  WHERE claim_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS ckr_requests_submitter_ip_idx
  ON public.ckr_requests (submitter_ip_hash, created_at DESC)
  WHERE submitter_ip_hash <> '';

-- Idempotency for anonymous: allow null from_user_id with key uniqueness per key
DROP INDEX IF EXISTS ckr_requests_idempotency_uidx;
CREATE UNIQUE INDEX IF NOT EXISTS ckr_requests_idempotency_uidx
  ON public.ckr_requests (coalesce(from_user_id, '00000000-0000-0000-0000-000000000000'::uuid), idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

-- ---------------------------------------------------------------------------
-- Rate-limit / abuse log (no PII plaintext — only hashed IP)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ckr_public_submit_rate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ckr_public_submit_rate_ip_idx
  ON public.ckr_public_submit_rate (ip_hash, created_at DESC);

ALTER TABLE public.ckr_public_submit_rate ENABLE ROW LEVEL SECURITY;
-- No policies for authenticated/anon — service_role / SECURITY DEFINER only

-- ---------------------------------------------------------------------------
-- Progressive cabinet access on profiles (optional override)
-- basic | standard | advanced
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ckr_access_level text NOT NULL DEFAULT 'basic';

COMMENT ON COLUMN public.profiles.ckr_access_level IS
  'Stage 4H progressive disclosure: basic|standard|advanced';

-- Existing admins / users with orgs stay usable; default basic is fine.
UPDATE public.profiles p
SET ckr_access_level = 'advanced'
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'admin'
);

-- ---------------------------------------------------------------------------
-- Access helper update: anonymous rows only for staff until claimed
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
          (r.from_user_id IS NOT NULL AND r.from_user_id = uid)
          OR (
            r.organization_id IS NOT NULL
            AND public.is_org_member(r.organization_id, uid)
          )
        )
    );
$$;

-- ---------------------------------------------------------------------------
-- Public submit IDEA (anon-safe). Never trusts caller for status/priority/etc.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_public_idea(
  p_name text,
  p_idea text,
  p_contact_phone text DEFAULT '',
  p_contact_email text DEFAULT '',
  p_contact_telegram text DEFAULT '',
  p_idempotency_key text DEFAULT NULL,
  p_ip_hash text DEFAULT '',
  p_claim_token_hash text DEFAULT NULL,
  p_claim_hours int DEFAULT 72
)
RETURNS TABLE (request_id uuid, already_exists boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := left(trim(coalesce(p_name, '')), 120);
  v_idea text := left(trim(coalesce(p_idea, '')), 8000);
  v_phone text := left(trim(coalesce(p_contact_phone, '')), 40);
  v_email text := left(lower(trim(coalesce(p_contact_email, ''))), 160);
  v_tg text := left(trim(coalesce(p_contact_telegram, '')), 80);
  v_ip text := left(trim(coalesce(p_ip_hash, '')), 128);
  v_key text := nullif(trim(coalesce(p_idempotency_key, '')), '');
  v_existing uuid;
  v_recent int;
  v_id uuid;
BEGIN
  IF char_length(v_name) < 2 THEN
    RAISE EXCEPTION 'name_too_short';
  END IF;
  IF char_length(v_idea) < 20 THEN
    RAISE EXCEPTION 'idea_too_short';
  END IF;

  -- Rate limit: max 5 submissions / hour / ip_hash (when provided)
  IF v_ip <> '' THEN
    SELECT count(*) INTO v_recent
    FROM public.ckr_public_submit_rate
    WHERE ip_hash = v_ip
      AND created_at > now() - interval '1 hour';
    IF v_recent >= 5 THEN
      RAISE EXCEPTION 'rate_limited';
    END IF;
    INSERT INTO public.ckr_public_submit_rate (ip_hash) VALUES (v_ip);
  END IF;

  IF v_key IS NOT NULL THEN
    SELECT id INTO v_existing
    FROM public.ckr_requests
    WHERE idempotency_key = v_key
      AND from_user_id IS NULL
    LIMIT 1;
    IF v_existing IS NOT NULL THEN
      request_id := v_existing;
      already_exists := true;
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;

  INSERT INTO public.ckr_requests (
    subject,
    body,
    request_type,
    status,
    priority,
    source,
    source_table,
    from_user_id,
    contact_name,
    contact_phone,
    contact_email,
    contact_telegram,
    claim_token_hash,
    claim_expires_at,
    submitter_ip_hash,
    idempotency_key,
    region
  ) VALUES (
    left('Идея · ' || v_name, 200),
    v_idea,
    'IDEA',
    'NEW',
    'NORMAL',
    'public_idea_form',
    'public_idea_form',
    NULL,
    v_name,
    v_phone,
    v_email,
    v_tg,
    nullif(p_claim_token_hash, ''),
    CASE WHEN p_claim_token_hash IS NOT NULL AND p_claim_token_hash <> ''
      THEN now() + make_interval(hours => greatest(1, least(coalesce(p_claim_hours, 72), 168)))
      ELSE NULL END,
    v_ip,
    v_key,
    ''
  )
  RETURNING id INTO v_id;

  INSERT INTO public.ckr_request_events (
    request_id, event_type, title, detail, visibility, actor_user_id, meta
  ) VALUES (
    v_id,
    'APPLICATION_CREATED',
    'Идея отправлена с сайта',
    'Источник: Сайт ЦКР · без регистрации',
    'CLIENT',
    NULL,
    jsonb_build_object('source', 'public_idea_form', 'anonymous', true)
  );

  request_id := v_id;
  already_exists := false;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_public_idea(
  text, text, text, text, text, text, text, text, int
) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_public_idea(
  text, text, text, text, text, text, text, text, int
) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Claim anonymous IDEA after registration/login
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_ckr_request(
  p_request_id uuid,
  p_claim_token_hash text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.ckr_requests%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF p_claim_token_hash IS NULL OR length(trim(p_claim_token_hash)) < 16 THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  SELECT * INTO v_row
  FROM public.ckr_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_row.from_user_id IS NOT NULL THEN
    IF v_row.from_user_id = v_uid THEN
      RETURN v_row.id; -- already owned by claimant
    END IF;
    RAISE EXCEPTION 'already_claimed';
  END IF;
  IF v_row.claim_token_hash IS NULL OR v_row.claim_token_hash <> p_claim_token_hash THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;
  IF v_row.claim_expires_at IS NOT NULL AND v_row.claim_expires_at < now() THEN
    RAISE EXCEPTION 'token_expired';
  END IF;
  IF v_row.claimed_at IS NOT NULL THEN
    RAISE EXCEPTION 'already_claimed';
  END IF;

  UPDATE public.ckr_requests
  SET
    from_user_id = v_uid,
    claimed_at = now(),
    claim_token_hash = NULL,
    claim_expires_at = NULL,
    updated_at = now()
  WHERE id = p_request_id;

  INSERT INTO public.ckr_request_events (
    request_id, event_type, title, detail, visibility, actor_user_id, meta
  ) VALUES (
    p_request_id,
    'CLAIMED',
    'Обращение привязано к кабинету',
    'Пользователь подтвердил владение идеей после регистрации',
    'CLIENT',
    v_uid,
    jsonb_build_object('claimed_by', v_uid)
  );

  RETURN p_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ckr_request(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_ckr_request(uuid, text)
  TO authenticated, service_role;

-- Optional contact update for anonymous request via claim token (before claim)
CREATE OR REPLACE FUNCTION public.update_public_idea_contact(
  p_request_id uuid,
  p_claim_token_hash text,
  p_contact_phone text DEFAULT '',
  p_contact_email text DEFAULT '',
  p_contact_telegram text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ckr_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.ckr_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF v_row.from_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'already_claimed';
  END IF;
  IF v_row.claim_token_hash IS NULL OR v_row.claim_token_hash <> p_claim_token_hash THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;
  IF v_row.claim_expires_at IS NOT NULL AND v_row.claim_expires_at < now() THEN
    RAISE EXCEPTION 'token_expired';
  END IF;

  UPDATE public.ckr_requests
  SET
    contact_phone = CASE
      WHEN trim(coalesce(p_contact_phone, '')) <> '' THEN left(trim(p_contact_phone), 40)
      ELSE contact_phone END,
    contact_email = CASE
      WHEN trim(coalesce(p_contact_email, '')) <> '' THEN left(lower(trim(p_contact_email)), 160)
      ELSE contact_email END,
    contact_telegram = CASE
      WHEN trim(coalesce(p_contact_telegram, '')) <> '' THEN left(trim(p_contact_telegram), 80)
      ELSE contact_telegram END,
    updated_at = now()
  WHERE id = p_request_id;

  INSERT INTO public.ckr_request_events (
    request_id, event_type, title, detail, visibility, actor_user_id
  ) VALUES (
    p_request_id,
    'CONTACT_ADDED',
    'Контакт дополнен',
    'Посетитель оставил контакт после отправки идеи',
    'INTERNAL',
    NULL
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.update_public_idea_contact(uuid, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.update_public_idea_contact(uuid, text, text, text, text)
  TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
