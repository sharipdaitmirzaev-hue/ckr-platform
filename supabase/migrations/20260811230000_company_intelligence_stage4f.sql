-- Stage 4F — Company Intelligence (additive on organizations).
-- organizations remains source of truth. No parallel company table.
-- Does NOT weaken existing RLS; extends public select for listed verified orgs.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS legal_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS inn text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ogrn text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS legal_form text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS industry text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subindustry text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS public_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS public_phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS products_services text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS offers_summary text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seeks_summary text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_label text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS owner_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS lia_enrichment_draft jsonb,
  ADD COLUMN IF NOT EXISTS is_listed boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.organizations.legal_name IS
  'Stage 4F — полное юридическое название (UNKNOWN если пусто)';
COMMENT ON COLUMN public.organizations.inn IS
  'Stage 4F — ИНН; пустая строка = UNKNOWN; не выдумывать';
COMMENT ON COLUMN public.organizations.ogrn IS
  'Stage 4F — ОГРН/ОГРНИП; пустая строка = UNKNOWN';
COMMENT ON COLUMN public.organizations.offers_summary IS
  'Stage 4F — что предлагает (бизнес-контекст)';
COMMENT ON COLUMN public.organizations.seeks_summary IS
  'Stage 4F — что ищет (бизнес-контекст)';
COMMENT ON COLUMN public.organizations.owner_notes IS
  'Stage 4F — OWNER_ONLY заметки; не показывать публично';
COMMENT ON COLUMN public.organizations.lia_enrichment_draft IS
  'Stage 4F — OWNER_ONLY черновик обогащения Лии; без автопубликации фактов';

-- Strong identity: unique INN when provided (10 or 12 digits)
CREATE UNIQUE INDEX IF NOT EXISTS organizations_inn_unique_idx
  ON public.organizations (inn)
  WHERE inn ~ '^\d{10}(\d{2})?$';

CREATE UNIQUE INDEX IF NOT EXISTS organizations_ogrn_unique_idx
  ON public.organizations (ogrn)
  WHERE ogrn ~ '^\d{13}(\d{2})?$';

CREATE INDEX IF NOT EXISTS organizations_industry_idx
  ON public.organizations (industry);
CREATE INDEX IF NOT EXISTS organizations_is_listed_idx
  ON public.organizations (is_listed);

-- Timeline events (lightweight; no Matching)
CREATE TABLE IF NOT EXISTS public.organization_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL
    REFERENCES public.organizations (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL DEFAULT '',
  detail text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'CKR_ONLY'
    CHECK (visibility IN ('PUBLIC', 'CKR_ONLY', 'OWNER_ONLY')),
  actor_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organization_events_org_idx
  ON public.organization_events (organization_id, created_at DESC);

ALTER TABLE public.organization_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_events_select ON public.organization_events;
CREATE POLICY organization_events_select
ON public.organization_events
FOR SELECT
TO anon, authenticated
USING (
  visibility = 'PUBLIC'
  OR public.is_admin(auth.uid())
  OR (
    auth.uid() IS NOT NULL
    AND public.is_org_member(organization_id, auth.uid())
    AND visibility IN ('PUBLIC', 'CKR_ONLY', 'OWNER_ONLY')
  )
);

DROP POLICY IF EXISTS organization_events_insert ON public.organization_events;
CREATE POLICY organization_events_insert
ON public.organization_events
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
  OR public.can_manage_org(organization_id, auth.uid())
);

COMMENT ON TABLE public.organization_events IS
  'Stage 4F — timeline компании; PUBLIC/CKR_ONLY/OWNER_ONLY';
