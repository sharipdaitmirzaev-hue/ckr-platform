-- LIA Opportunity Intelligence — Stage 2B persistence (PREPARED ONLY)
-- Additive over 20260810220000_lia_oi_stage1.sql
-- DO NOT apply to production without explicit owner confirmation.
-- Distinct from public catalog table `opportunities`.

-- =============================================================================
-- 1) Search runs — extend for LIVE metrics / duration / provider
-- =============================================================================
ALTER TABLE public.lia_oi_search_runs
  ADD COLUMN IF NOT EXISTS search_mode text NOT NULL DEFAULT 'stub'
    CHECK (search_mode IN ('stub', 'live')),
  ADD COLUMN IF NOT EXISTS provider_label text,
  ADD COLUMN IF NOT EXISTS stats_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS error_summary text,
  ADD COLUMN IF NOT EXISTS queries_run integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS signals_raw integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rejected_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.lia_oi_search_runs.plan_json IS
  'Full Search Plan JSON (intent, hard/soft constraints, queries, source classes).';

-- =============================================================================
-- 2) Opportunities — Stage 2A.x / 2A.2 fields + identity
-- =============================================================================
ALTER TABLE public.lia_oi_opportunities
  ADD COLUMN IF NOT EXISTS fingerprint text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS source_object_id text,
  ADD COLUMN IF NOT EXISTS page_type text NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS content_intent text NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS is_catalog_source boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS result_bucket text,
  ADD COLUMN IF NOT EXISTS reject_reason text,
  ADD COLUMN IF NOT EXISTS budget_fit text NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS price_status text NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS price_kind text NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS detail_confidence numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS detail_signals text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS missing_fields text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS why_recommend text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS why_top text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS score_relevance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_quality numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_opportunity numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue numeric,
  ADD COLUMN IF NOT EXISTS profit numeric,
  ADD COLUMN IF NOT EXISTS payback_period text,
  ADD COLUMN IF NOT EXISTS asset_type text,
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS land_area text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contacts_public text,
  ADD COLUMN IF NOT EXISTS is_stub boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS enriched_from_fetch boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discovery_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS normalized_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS owner_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_status_set_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_status_set_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subindustry text,
  ADD COLUMN IF NOT EXISTS source_class text;

-- Backfill fingerprint from canonical_key when empty
UPDATE public.lia_oi_opportunities
SET fingerprint = canonical_key
WHERE fingerprint IS NULL OR fingerprint = '';

CREATE UNIQUE INDEX IF NOT EXISTS lia_oi_opportunities_fingerprint_uidx
  ON public.lia_oi_opportunities (fingerprint)
  WHERE fingerprint IS NOT NULL AND fingerprint <> '';

CREATE INDEX IF NOT EXISTS lia_oi_opportunities_canonical_url_idx
  ON public.lia_oi_opportunities (canonical_url);
CREATE INDEX IF NOT EXISTS lia_oi_opportunities_bucket_idx
  ON public.lia_oi_opportunities (result_bucket);
CREATE INDEX IF NOT EXISTS lia_oi_opportunities_region_idx
  ON public.lia_oi_opportunities (region);
CREATE INDEX IF NOT EXISTS lia_oi_opportunities_industry_idx
  ON public.lia_oi_opportunities (industry);
CREATE INDEX IF NOT EXISTS lia_oi_opportunities_first_seen_idx
  ON public.lia_oi_opportunities (first_seen_at DESC);
CREATE INDEX IF NOT EXISTS lia_oi_opportunities_last_seen_idx
  ON public.lia_oi_opportunities (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS lia_oi_opportunities_score_opp_idx
  ON public.lia_oi_opportunities (score_opportunity DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS lia_oi_opportunities_created_at_idx
  ON public.lia_oi_opportunities (created_at DESC);
CREATE INDEX IF NOT EXISTS lia_oi_opportunities_search_run_idx
  ON public.lia_oi_opportunities (search_run_id);
CREATE INDEX IF NOT EXISTS lia_oi_opportunities_budget_fit_idx
  ON public.lia_oi_opportunities (budget_fit);
CREATE INDEX IF NOT EXISTS lia_oi_opportunities_content_intent_idx
  ON public.lia_oi_opportunities (content_intent);

-- =============================================================================
-- 3) Sources — discovery metadata (no full HTML storage)
-- =============================================================================
ALTER TABLE public.lia_oi_sources
  ADD COLUMN IF NOT EXISTS discovered_at timestamptz,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS snippet text,
  ADD COLUMN IF NOT EXISTS fetch_status text,
  ADD COLUMN IF NOT EXISTS meta_json jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS lia_oi_sources_canonical_url_idx
  ON public.lia_oi_sources (canonical_url);
CREATE INDEX IF NOT EXISTS lia_oi_sources_url_idx
  ON public.lia_oi_sources (url);

-- =============================================================================
-- 4) Search run ↔ candidate link (many-to-many discovery)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lia_oi_search_run_candidates (
  search_run_id text NOT NULL REFERENCES public.lia_oi_search_runs (id) ON DELETE CASCADE,
  opportunity_id text NOT NULL REFERENCES public.lia_oi_opportunities (id) ON DELETE CASCADE,
  result_bucket text,
  rank_in_run integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (search_run_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS lia_oi_src_opp_idx
  ON public.lia_oi_search_run_candidates (opportunity_id);

-- =============================================================================
-- 5) Change tracking / snapshots (for future «цена снизилась…»)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lia_oi_opportunity_changes (
  id text PRIMARY KEY,
  opportunity_id text NOT NULL REFERENCES public.lia_oi_opportunities (id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  change_kind text NOT NULL DEFAULT 'FIELD_UPDATE'
    CHECK (change_kind IN (
      'FIELD_UPDATE', 'STATUS_CHANGE', 'REDISCOVERY', 'OWNER_DECISION', 'ENRICHMENT'
    )),
  source_run_id text REFERENCES public.lia_oi_search_runs (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lia_oi_opp_changes_opp_idx
  ON public.lia_oi_opportunity_changes (opportunity_id, created_at DESC);

-- Compact snapshot for audit (NOT full HTML)
CREATE TABLE IF NOT EXISTS public.lia_oi_opportunity_snapshots (
  id text PRIMARY KEY,
  opportunity_id text NOT NULL REFERENCES public.lia_oi_opportunities (id) ON DELETE CASCADE,
  snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text NOT NULL DEFAULT 'rediscovery',
  search_run_id text REFERENCES public.lia_oi_search_runs (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lia_oi_opp_snapshots_opp_idx
  ON public.lia_oi_opportunity_snapshots (opportunity_id, created_at DESC);

-- =============================================================================
-- 6) Timeline / history events (owner-visible)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.lia_oi_opportunity_events (
  id text PRIMARY KEY,
  opportunity_id text NOT NULL REFERENCES public.lia_oi_opportunities (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  detail text,
  actor_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  search_run_id text REFERENCES public.lia_oi_search_runs (id) ON DELETE SET NULL,
  meta_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lia_oi_opp_events_opp_idx
  ON public.lia_oi_opportunity_events (opportunity_id, created_at DESC);

-- =============================================================================
-- 7) Assignments — align statuses to Stage 2B
-- =============================================================================
-- Drop old CHECK if present and recreate with PENDING/…/COMPLETED
ALTER TABLE public.lia_oi_assignments
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_summary text;

-- Снять старый CHECK до нормализации статусов
ALTER TABLE public.lia_oi_assignments
  DROP CONSTRAINT IF EXISTS lia_oi_assignments_status_check;

UPDATE public.lia_oi_assignments SET status = 'PENDING'
  WHERE status IN ('OPEN', 'queued', 'PENDING');
UPDATE public.lia_oi_assignments SET status = 'COMPLETED'
  WHERE status IN ('DONE', 'done', 'COMPLETED');
UPDATE public.lia_oi_assignments SET status = 'RUNNING' WHERE status = 'RUNNING';
UPDATE public.lia_oi_assignments SET status = 'FAILED' WHERE status = 'FAILED';
UPDATE public.lia_oi_assignments SET status = 'CANCELLED' WHERE status = 'CANCELLED';

ALTER TABLE public.lia_oi_assignments
  ADD CONSTRAINT lia_oi_assignments_status_check
  CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'));

CREATE INDEX IF NOT EXISTS lia_oi_assignments_opportunity_idx
  ON public.lia_oi_assignments (opportunity_id);
CREATE INDEX IF NOT EXISTS lia_oi_assignments_created_at_idx
  ON public.lia_oi_assignments (created_at DESC);

-- =============================================================================
-- 8) Feedback / reports indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS lia_oi_feedback_created_at_idx
  ON public.lia_oi_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS lia_oi_feedback_event_idx
  ON public.lia_oi_feedback (event);
CREATE INDEX IF NOT EXISTS lia_oi_reports_kind_idx
  ON public.lia_oi_reports (kind);
CREATE INDEX IF NOT EXISTS lia_oi_reports_created_at_idx
  ON public.lia_oi_reports (created_at DESC);

ALTER TABLE public.lia_oi_reports
  ADD COLUMN IF NOT EXISTS search_run_id text REFERENCES public.lia_oi_search_runs (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.lia_oi_feedback
  ADD COLUMN IF NOT EXISTS meta_json jsonb NOT NULL DEFAULT '{}'::jsonb;

-- =============================================================================
-- 9) RLS — admin/owner only (is_admin)
-- =============================================================================
ALTER TABLE public.lia_oi_search_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lia_oi_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lia_oi_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lia_oi_hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lia_oi_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lia_oi_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lia_oi_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lia_oi_search_run_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lia_oi_opportunity_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lia_oi_opportunity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lia_oi_opportunity_events ENABLE ROW LEVEL SECURITY;

-- Helper: drop+create policy idempotently
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'lia_oi_search_runs',
    'lia_oi_opportunities',
    'lia_oi_sources',
    'lia_oi_hypotheses',
    'lia_oi_feedback',
    'lia_oi_assignments',
    'lia_oi_reports',
    'lia_oi_search_run_candidates',
    'lia_oi_opportunity_changes',
    'lia_oi_opportunity_snapshots',
    'lia_oi_opportunity_events'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))',
      t || '_admin_all',
      t
    );
  END LOOP;
END $$;

COMMENT ON TABLE public.lia_oi_opportunity_changes IS
  'Field-level change log for rediscovery / owner decisions (Stage 2B).';
COMMENT ON TABLE public.lia_oi_opportunity_events IS
  'Owner-visible timeline for an OI opportunity.';
COMMENT ON TABLE public.lia_oi_search_run_candidates IS
  'Links a search run to discovered opportunities (memory of reconnaissance).';
