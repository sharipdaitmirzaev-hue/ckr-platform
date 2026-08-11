-- =============================================================================
-- Stage 4C — Controlled Publish: LIA OI → user-safe marketplace opportunities
-- =============================================================================
-- Additive only. Does NOT weaken lia_oi_* RLS.
-- Does NOT create Matching Engine / MATCHES / Synthesis / Scheduler.
-- Automatic mass publish is forbidden — owner approval required.
-- =============================================================================

-- New marketplace categories for published LIA intelligence
INSERT INTO public.opportunity_categories (name, slug) VALUES
  ('Господдержка', 'support_program'),
  ('Закупки / тендеры', 'procurement'),
  ('Активы на торгах', 'auction_asset')
ON CONFLICT (slug) DO NOTHING;

-- User-safe provenance / source fields on marketplace opportunities
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_id text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS source_label text,
  ADD COLUMN IF NOT EXISTS source_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS fingerprint text,
  ADD COLUMN IF NOT EXISTS amount_kind text,
  ADD COLUMN IF NOT EXISTS deadline_at timestamptz,
  ADD COLUMN IF NOT EXISTS data_quality_score numeric,
  ADD COLUMN IF NOT EXISTS matching_readiness text,
  ADD COLUMN IF NOT EXISTS owner_edited_fields text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pending_source_changes jsonb,
  ADD COLUMN IF NOT EXISTS published_from_lia_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE public.opportunities
  DROP CONSTRAINT IF EXISTS opportunities_source_type_check;
ALTER TABLE public.opportunities
  ADD CONSTRAINT opportunities_source_type_check
  CHECK (source_type IN ('manual', 'lia_oi', 'import'));

CREATE UNIQUE INDEX IF NOT EXISTS opportunities_lia_source_uidx
  ON public.opportunities (source_type, source_id)
  WHERE source_type = 'lia_oi'
    AND source_id IS NOT NULL
    AND source_id <> '';

CREATE UNIQUE INDEX IF NOT EXISTS opportunities_fingerprint_uidx
  ON public.opportunities (fingerprint)
  WHERE fingerprint IS NOT NULL AND fingerprint <> '';

CREATE INDEX IF NOT EXISTS opportunities_deadline_idx
  ON public.opportunities (deadline_at)
  WHERE deadline_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS opportunities_source_type_idx
  ON public.opportunities (source_type);

-- Track publication state on LIA OI without exposing rows to end users
ALTER TABLE public.lia_oi_opportunities
  ADD COLUMN IF NOT EXISTS marketplace_opportunity_id uuid
    REFERENCES public.opportunities (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS publication_state text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS publication_locked_fields text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pending_public_changes jsonb,
  ADD COLUMN IF NOT EXISTS last_publication_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_publication_by uuid
    REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE public.lia_oi_opportunities
  DROP CONSTRAINT IF EXISTS lia_oi_opportunities_publication_state_check;
ALTER TABLE public.lia_oi_opportunities
  ADD CONSTRAINT lia_oi_opportunities_publication_state_check
  CHECK (publication_state IN (
    'none',
    'queued',
    'rejected',
    'published',
    'change_review',
    'archived'
  ));

CREATE INDEX IF NOT EXISTS lia_oi_publication_state_idx
  ON public.lia_oi_opportunities (publication_state);

CREATE INDEX IF NOT EXISTS lia_oi_marketplace_opp_idx
  ON public.lia_oi_opportunities (marketplace_opportunity_id)
  WHERE marketplace_opportunity_id IS NOT NULL;

-- Audit trail for controlled publish decisions
CREATE TABLE IF NOT EXISTS public.lia_oi_publication_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lia_oi_id text NOT NULL REFERENCES public.lia_oi_opportunities (id) ON DELETE CASCADE,
  marketplace_opportunity_id uuid REFERENCES public.opportunities (id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  action text NOT NULL
    CHECK (action IN (
      'queue',
      'approve_publish',
      'reject',
      'edit_draft',
      'request_recheck',
      'apply_changes',
      'reject_changes',
      'archive',
      'rediscovery_update'
    )),
  reason text,
  before_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  public_projection jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lia_oi_publication_events_oi_idx
  ON public.lia_oi_publication_events (lia_oi_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lia_oi_publication_events_opp_idx
  ON public.lia_oi_publication_events (marketplace_opportunity_id, created_at DESC);

ALTER TABLE public.lia_oi_publication_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lia_oi_publication_events_admin_all ON public.lia_oi_publication_events;
CREATE POLICY lia_oi_publication_events_admin_all
  ON public.lia_oi_publication_events
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_operator(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_operator(auth.uid()));

COMMENT ON TABLE public.lia_oi_publication_events IS
  'Stage 4C audit: owner-controlled publish of LIA OI into marketplace. Not Matching Engine.';
COMMENT ON COLUMN public.opportunities.source_type IS
  'manual | lia_oi | import. lia_oi rows are projections; internal OI stays OWNER_ONLY.';

-- Allow platform admin/operator to insert published projections (owner_id = actor).
DROP POLICY IF EXISTS opportunities_insert_admin ON public.opportunities;
CREATE POLICY opportunities_insert_admin
  ON public.opportunities
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_operator(auth.uid()));
