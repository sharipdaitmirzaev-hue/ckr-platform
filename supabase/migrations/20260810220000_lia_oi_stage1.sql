-- LIA Opportunity Intelligence — Stage 1 schema (PREPARED ONLY)
-- DO NOT apply to production without explicit owner confirmation.
-- Stage 1 runtime uses in-memory store; this SQL is for Stage 2+ persistence.
-- Distinct from public catalog table `opportunities`.

-- ---------------------------------------------------------------------------
-- Search runs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lia_oi_search_runs (
  id text PRIMARY KEY,
  query text NOT NULL,
  intent text NOT NULL DEFAULT 'general_opportunity',
  country text NOT NULL DEFAULT 'RU',
  regions text[] NOT NULL DEFAULT '{}',
  budget_min numeric,
  budget_max numeric,
  plan_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  candidate_ids text[] NOT NULL DEFAULT '{}',
  stub_mode boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lia_oi_search_runs_created_at_idx
  ON public.lia_oi_search_runs (created_at DESC);

-- ---------------------------------------------------------------------------
-- Opportunity candidates (OI feed; NOT public.opportunities)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lia_oi_opportunities (
  id text PRIMARY KEY,
  search_run_id text REFERENCES public.lia_oi_search_runs (id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'opportunity_signal',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  why_interesting text[] NOT NULL DEFAULT '{}',
  recommendation text NOT NULL DEFAULT '',
  next_step text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'NEW'
    CHECK (status IN (
      'NEW', 'REVIEWING', 'INTERESTING', 'DEEP_RESEARCH',
      'SAVED', 'PROJECT_CREATED', 'PUBLISHED', 'REJECTED', 'ARCHIVED'
    )),
  country text NOT NULL DEFAULT 'RU',
  region text,
  city text,
  industry text,
  asking_price numeric,
  investment_required numeric,
  score_overall numeric NOT NULL DEFAULT 0,
  score_confidence numeric NOT NULL DEFAULT 0,
  score_priority text NOT NULL DEFAULT 'NORMAL',
  score_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  score_explanation text[] NOT NULL DEFAULT '{}',
  claims jsonb NOT NULL DEFAULT '[]'::jsonb,
  risks text[] NOT NULL DEFAULT '{}',
  unknowns text[] NOT NULL DEFAULT '{}',
  to_verify text[] NOT NULL DEFAULT '{}',
  match_hints text[] NOT NULL DEFAULT '{}',
  canonical_key text NOT NULL,
  raw_stub_ids text[] NOT NULL DEFAULT '{}',
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lia_oi_opportunities_status_idx
  ON public.lia_oi_opportunities (status);
CREATE INDEX IF NOT EXISTS lia_oi_opportunities_score_idx
  ON public.lia_oi_opportunities (score_overall DESC);
CREATE INDEX IF NOT EXISTS lia_oi_opportunities_canonical_idx
  ON public.lia_oi_opportunities (canonical_key);

-- ---------------------------------------------------------------------------
-- Sources / evidence
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lia_oi_sources (
  id text PRIMARY KEY,
  opportunity_id text NOT NULL REFERENCES public.lia_oi_opportunities (id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'STUB_DEMO',
  name text NOT NULL DEFAULT '',
  url text NOT NULL,
  published_at timestamptz,
  is_stub boolean NOT NULL DEFAULT true,
  retrieved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lia_oi_sources_opportunity_idx
  ON public.lia_oi_sources (opportunity_id);

-- ---------------------------------------------------------------------------
-- Hypotheses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lia_oi_hypotheses (
  id text PRIMARY KEY,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  supporting_candidate_ids text[] NOT NULL DEFAULT '{}',
  missing_pieces text[] NOT NULL DEFAULT '{}',
  investment_scale text,
  status text NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'ACTIVE', 'VALIDATED', 'REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Feedback (owner decisions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lia_oi_feedback (
  id text PRIMARY KEY,
  opportunity_id text NOT NULL REFERENCES public.lia_oi_opportunities (id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  event text NOT NULL
    CHECK (event IN (
      'INTERESTED', 'SAVE', 'REJECT', 'DEEP_RESEARCH', 'CREATE_PROJECT', 'PUBLISH'
    )),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lia_oi_feedback_opportunity_idx
  ON public.lia_oi_feedback (opportunity_id);

-- ---------------------------------------------------------------------------
-- Assignments / поручения Лии
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lia_oi_assignments (
  id text PRIMARY KEY,
  opportunity_id text NOT NULL REFERENCES public.lia_oi_opportunities (id) ON DELETE CASCADE,
  kind text NOT NULL,
  instruction text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'RUNNING', 'DONE', 'FAILED', 'CANCELLED')),
  result_summary text,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lia_oi_assignments_status_idx
  ON public.lia_oi_assignments (status);

-- ---------------------------------------------------------------------------
-- Reports / digests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lia_oi_reports (
  id text PRIMARY KEY,
  kind text NOT NULL DEFAULT 'search_result',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  candidate_ids text[] NOT NULL DEFAULT '{}',
  stub_mode boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- RLS: owner/admin only — NOT enabled in Stage 1.
-- Apply together with a separate hardening migration after owner confirmation.
-- ---------------------------------------------------------------------------
-- ALTER TABLE public.lia_oi_search_runs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.lia_oi_opportunities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.lia_oi_sources ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.lia_oi_hypotheses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.lia_oi_feedback ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.lia_oi_assignments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.lia_oi_reports ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.lia_oi_opportunities IS
  'LIA OI opportunity candidates (owner intelligence). Distinct from public.opportunities catalog.';
