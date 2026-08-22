-- LIA Opportunity Intelligence — Stage 2C specialized sources (ADDITIVE)
-- Safe: IF NOT EXISTS / ADD COLUMN IF NOT EXISTS. No DROP. No public.opportunities changes.

ALTER TABLE public.lia_oi_opportunities
  ADD COLUMN IF NOT EXISTS opportunity_type text NOT NULL DEFAULT 'WEB_LISTING',
  ADD COLUMN IF NOT EXISTS source_adapter_id text NOT NULL DEFAULT 'serper_general',
  ADD COLUMN IF NOT EXISTS source_confidence numeric NULL,
  ADD COLUMN IF NOT EXISTS is_official_source boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deadline_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS days_remaining integer NULL;

CREATE INDEX IF NOT EXISTS lia_oi_opportunities_adapter_idx
  ON public.lia_oi_opportunities (source_adapter_id);

CREATE INDEX IF NOT EXISTS lia_oi_opportunities_type_idx
  ON public.lia_oi_opportunities (opportunity_type);

CREATE INDEX IF NOT EXISTS lia_oi_opportunities_deadline_idx
  ON public.lia_oi_opportunities (deadline_at);

CREATE INDEX IF NOT EXISTS lia_oi_opportunities_official_idx
  ON public.lia_oi_opportunities (is_official_source)
  WHERE is_official_source = true;

COMMENT ON COLUMN public.lia_oi_opportunities.source_adapter_id IS
  'Stage 2C adapter: serper_general | auction_assets | procurement | support_programs';
COMMENT ON COLUMN public.lia_oi_opportunities.is_official_source IS
  'True when candidate came from an official specialized source adapter';
COMMENT ON COLUMN public.lia_oi_opportunities.deadline_at IS
  'Auction/tender/grant deadline when known';
