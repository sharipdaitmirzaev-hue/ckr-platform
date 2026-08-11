-- LIA Opportunity Intelligence — Stage 2C.1 structured enrichment (ADDITIVE)
-- Safe: ADD COLUMN IF NOT EXISTS. No DROP. No public.opportunities changes.

ALTER TABLE public.lia_oi_opportunities
  ADD COLUMN IF NOT EXISTS data_quality_score numeric NULL,
  ADD COLUMN IF NOT EXISTS matching_readiness text NULL,
  ADD COLUMN IF NOT EXISTS confirmed_fields text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS unknown_fields text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_published_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS auction_status text NULL,
  ADD COLUMN IF NOT EXISTS procurement_stage text NULL,
  ADD COLUMN IF NOT EXISTS organizer text NULL,
  ADD COLUMN IF NOT EXISTS customer text NULL,
  ADD COLUMN IF NOT EXISTS support_type text NULL,
  ADD COLUMN IF NOT EXISTS starting_price numeric NULL,
  ADD COLUMN IF NOT EXISTS current_price numeric NULL,
  ADD COLUMN IF NOT EXISTS nmck numeric NULL,
  ADD COLUMN IF NOT EXISTS support_amount numeric NULL,
  ADD COLUMN IF NOT EXISTS address text NULL,
  ADD COLUMN IF NOT EXISTS eligibility text NULL;

CREATE INDEX IF NOT EXISTS lia_oi_opportunities_matching_readiness_idx
  ON public.lia_oi_opportunities (matching_readiness);

CREATE INDEX IF NOT EXISTS lia_oi_opportunities_data_quality_idx
  ON public.lia_oi_opportunities (data_quality_score);

COMMENT ON COLUMN public.lia_oi_opportunities.matching_readiness IS
  'Stage 2C.1: READY | PARTIAL | NOT_READY — readiness for future Matching Engine';
COMMENT ON COLUMN public.lia_oi_opportunities.data_quality_score IS
  'Stage 2C.1: 0–100 structured data quality (confirmed fields)';
