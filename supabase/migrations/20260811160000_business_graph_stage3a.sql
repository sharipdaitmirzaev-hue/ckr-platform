-- =============================================================================
-- Business Graph — Stage 3A Foundation (PREPARED ONLY)
-- =============================================================================
-- Additive only. Does NOT alter lia_oi_* or marketplace core tables.
-- Matching / Synthesis / Scheduler are OUT OF SCOPE.
-- Apply via scripts/apply-business-graph-stage3a-production.sh
-- (requires CKR_CONFIRM_BUSINESS_GRAPH_APPLY=YES) after local dry-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Optional catalogs (extensible; not hard enums)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_graph_node_type_catalog (
  code text PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.business_graph_relationship_type_catalog (
  code text PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true
);

INSERT INTO public.business_graph_node_type_catalog (code, label) VALUES
  ('CAPITAL', 'Капитал'),
  ('PROJECT', 'Проект'),
  ('BUSINESS', 'Бизнес'),
  ('ASSET', 'Актив'),
  ('PROPERTY', 'Недвижимость / площадка'),
  ('EQUIPMENT', 'Оборудование'),
  ('SUPPLY', 'Поставка'),
  ('DEMAND', 'Спрос / закупка'),
  ('PARTNER', 'Партнёр'),
  ('EXPERTISE', 'Экспертиза'),
  ('SUPPORT', 'Поддержка'),
  ('LICENSE', 'Лицензия'),
  ('INFRASTRUCTURE', 'Инфраструктура'),
  ('MARKET_SIGNAL', 'Рыночный сигнал'),
  ('OPPORTUNITY', 'Бизнес-возможность (конструкция)'),
  ('CONTRACT', 'Контракт'),
  ('COMPANY', 'Компания'),
  ('PERSON', 'Персона'),
  ('LOCATION', 'Локация')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.business_graph_relationship_type_catalog (code, label) VALUES
  ('CAN_FINANCE', 'Может финансировать'),
  ('CAN_INVEST_IN', 'Может инвестировать в'),
  ('CAN_PARTNER_WITH', 'Может партнёрить'),
  ('REQUIRES', 'Требует'),
  ('REQUIRED_BY', 'Требуется для'),
  ('SUPPLIES', 'Поставляет'),
  ('BUYS', 'Покупает'),
  ('LOCATED_IN', 'Расположен в'),
  ('SUITABLE_FOR', 'Подходит для'),
  ('SUPPORTED_BY', 'Поддержан'),
  ('DEPENDS_ON', 'Зависит от'),
  ('COMPETES_WITH', 'Конкурирует с'),
  ('COMPLEMENTS', 'Дополняет'),
  ('CAN_MANAGE', 'Может управлять'),
  ('CAN_SELL_TO', 'Может продавать'),
  ('CAN_BUY_FROM', 'Может покупать у'),
  ('RELATED_TO', 'Связан с'),
  ('DERIVED_FROM', 'Собран из'),
  ('CONFIRMS', 'Подтверждает'),
  ('CONTRADICTS', 'Противоречит'),
  ('OWNS', 'Владеет'),
  ('OPERATES', 'Оперирует'),
  ('NEEDS', 'Нуждается в'),
  ('HAS', 'Имеет'),
  ('SERVES', 'Обслуживает'),
  ('MATCHES', 'Совпадает (будущий Matching)'),
  ('CREATES_DEMAND_FOR', 'Создаёт спрос для')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Nodes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_graph_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',

  source_type text,
  source_id text,
  source_url text,

  internal_entity_type text,
  internal_entity_id text,

  country text NOT NULL DEFAULT 'RU',
  region text,
  city text,
  location_data jsonb NOT NULL DEFAULT '{}'::jsonb,

  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'ARCHIVED', 'MERGED', 'DRAFT')),
  visibility text NOT NULL DEFAULT 'OWNER_ONLY'
    CHECK (visibility IN ('PUBLIC', 'USER', 'INTERNAL', 'OWNER_ONLY')),

  structured_data jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Scores are intentionally separate
  data_confidence numeric NOT NULL DEFAULT 0
    CHECK (data_confidence >= 0 AND data_confidence <= 100),
  data_quality_score numeric NOT NULL DEFAULT 0
    CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  opportunity_attractiveness numeric
    CHECK (
      opportunity_attractiveness IS NULL
      OR (opportunity_attractiveness >= 0 AND opportunity_attractiveness <= 100)
    ),

  fingerprint text,
  merged_into_id uuid REFERENCES public.business_graph_nodes (id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS business_graph_nodes_source_uidx
  ON public.business_graph_nodes (source_type, source_id)
  WHERE source_type IS NOT NULL AND source_id IS NOT NULL AND source_id <> '';

CREATE UNIQUE INDEX IF NOT EXISTS business_graph_nodes_internal_uidx
  ON public.business_graph_nodes (internal_entity_type, internal_entity_id)
  WHERE internal_entity_type IS NOT NULL
    AND internal_entity_id IS NOT NULL
    AND internal_entity_id <> '';

CREATE UNIQUE INDEX IF NOT EXISTS business_graph_nodes_fingerprint_uidx
  ON public.business_graph_nodes (fingerprint)
  WHERE fingerprint IS NOT NULL AND fingerprint <> '';

CREATE INDEX IF NOT EXISTS business_graph_nodes_type_idx
  ON public.business_graph_nodes (node_type);
CREATE INDEX IF NOT EXISTS business_graph_nodes_status_idx
  ON public.business_graph_nodes (status);
CREATE INDEX IF NOT EXISTS business_graph_nodes_region_idx
  ON public.business_graph_nodes (region);
CREATE INDEX IF NOT EXISTS business_graph_nodes_visibility_idx
  ON public.business_graph_nodes (visibility);
CREATE INDEX IF NOT EXISTS business_graph_nodes_created_at_idx
  ON public.business_graph_nodes (created_at DESC);

COMMENT ON COLUMN public.business_graph_nodes.opportunity_attractiveness IS
  'Economic attractiveness 0-100. NOT the same as data_confidence or edge confidence.';
COMMENT ON COLUMN public.business_graph_nodes.data_confidence IS
  'Confidence in source data authenticity/reliability.';

-- ---------------------------------------------------------------------------
-- Edges
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_graph_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id uuid NOT NULL REFERENCES public.business_graph_nodes (id) ON DELETE CASCADE,
  target_node_id uuid NOT NULL REFERENCES public.business_graph_nodes (id) ON DELETE CASCADE,
  relationship_type text NOT NULL,

  confidence numeric NOT NULL DEFAULT 0
    CHECK (confidence >= 0 AND confidence <= 100),
  strength numeric
    CHECK (strength IS NULL OR (strength >= 0 AND strength <= 1)),

  status text NOT NULL DEFAULT 'PROPOSED'
    CHECK (status IN ('PROPOSED', 'ACTIVE', 'CONFIRMED', 'REJECTED', 'ARCHIVED')),

  -- Prep for Matching Engine (unused in Stage 3A automation)
  match_class text
    CHECK (match_class IS NULL OR match_class IN ('HARD', 'SOFT', 'HYPOTHESIS')),

  provenance_type text NOT NULL DEFAULT 'UNKNOWN'
    CHECK (provenance_type IN ('FACT', 'INFERENCE', 'ESTIMATE', 'UNKNOWN')),
  reasoning_summary text NOT NULL DEFAULT '',

  source text,
  source_url text,

  created_by_kind text NOT NULL DEFAULT 'SYSTEM'
    CHECK (created_by_kind IN ('SYSTEM', 'LIA', 'OWNER', 'USER')),
  created_by_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,

  valid_from timestamptz,
  valid_to timestamptz,
  is_current boolean NOT NULL DEFAULT true,

  owner_comment text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CHECK (source_node_id <> target_node_id)
);

CREATE INDEX IF NOT EXISTS business_graph_edges_source_idx
  ON public.business_graph_edges (source_node_id);
CREATE INDEX IF NOT EXISTS business_graph_edges_target_idx
  ON public.business_graph_edges (target_node_id);
CREATE INDEX IF NOT EXISTS business_graph_edges_rel_idx
  ON public.business_graph_edges (relationship_type);
CREATE INDEX IF NOT EXISTS business_graph_edges_confidence_idx
  ON public.business_graph_edges (confidence DESC);
CREATE INDEX IF NOT EXISTS business_graph_edges_status_idx
  ON public.business_graph_edges (status);
CREATE INDEX IF NOT EXISTS business_graph_edges_current_idx
  ON public.business_graph_edges (is_current)
  WHERE is_current = true;
CREATE INDEX IF NOT EXISTS business_graph_edges_created_at_idx
  ON public.business_graph_edges (created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS business_graph_edges_active_uidx
  ON public.business_graph_edges (
    source_node_id,
    target_node_id,
    relationship_type
  )
  WHERE is_current = true
    AND status IN ('PROPOSED', 'ACTIVE', 'CONFIRMED');

COMMENT ON COLUMN public.business_graph_edges.confidence IS
  'Relationship confidence 0-100. Distinct from node data_confidence.';
COMMENT ON COLUMN public.business_graph_edges.match_class IS
  'HARD/SOFT/HYPOTHESIS reserved for future Matching Engine.';

-- ---------------------------------------------------------------------------
-- Aliases
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_graph_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid NOT NULL REFERENCES public.business_graph_nodes (id) ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  source text,
  confidence numeric NOT NULL DEFAULT 50
    CHECK (confidence >= 0 AND confidence <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_graph_aliases_node_idx
  ON public.business_graph_aliases (node_id);
CREATE INDEX IF NOT EXISTS business_graph_aliases_norm_idx
  ON public.business_graph_aliases (normalized_alias);

CREATE UNIQUE INDEX IF NOT EXISTS business_graph_aliases_uidx
  ON public.business_graph_aliases (node_id, normalized_alias);

-- ---------------------------------------------------------------------------
-- Node sources (evidence)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_graph_node_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid NOT NULL REFERENCES public.business_graph_nodes (id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id text,
  source_url text,
  title text,
  snippet text,
  is_primary boolean NOT NULL DEFAULT false,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_graph_node_sources_node_idx
  ON public.business_graph_node_sources (node_id);
CREATE INDEX IF NOT EXISTS business_graph_node_sources_type_idx
  ON public.business_graph_node_sources (source_type, source_id);

-- ---------------------------------------------------------------------------
-- Events / history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_graph_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL
    CHECK (event_type IN (
      'NODE_CREATED',
      'NODE_UPDATED',
      'EDGE_CREATED',
      'EDGE_UPDATED',
      'EDGE_CONFIRMED',
      'EDGE_REJECTED',
      'IDENTITY_MERGED',
      'ALIAS_ADDED',
      'OWNER_COMMENT'
    )),
  node_id uuid REFERENCES public.business_graph_nodes (id) ON DELETE SET NULL,
  edge_id uuid REFERENCES public.business_graph_edges (id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_kind text NOT NULL DEFAULT 'SYSTEM'
    CHECK (actor_kind IN ('SYSTEM', 'LIA', 'OWNER', 'USER')),
  actor_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_graph_events_node_idx
  ON public.business_graph_events (node_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_graph_events_edge_idx
  ON public.business_graph_events (edge_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_graph_events_type_idx
  ON public.business_graph_events (event_type);

-- ---------------------------------------------------------------------------
-- RLS — owner/admin only for Stage 3A (OI-like)
-- ---------------------------------------------------------------------------
ALTER TABLE public.business_graph_node_type_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_graph_relationship_type_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_graph_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_graph_node_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_graph_events ENABLE ROW LEVEL SECURITY;

-- Catalogs: readable by authenticated
DROP POLICY IF EXISTS business_graph_node_type_catalog_select ON public.business_graph_node_type_catalog;
CREATE POLICY business_graph_node_type_catalog_select
  ON public.business_graph_node_type_catalog
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS business_graph_rel_type_catalog_select ON public.business_graph_relationship_type_catalog;
CREATE POLICY business_graph_rel_type_catalog_select
  ON public.business_graph_relationship_type_catalog
  FOR SELECT TO authenticated
  USING (true);

-- Graph data: admin only (platform owner cabinet). Service role bypasses RLS.
DROP POLICY IF EXISTS business_graph_nodes_admin_all ON public.business_graph_nodes;
CREATE POLICY business_graph_nodes_admin_all
  ON public.business_graph_nodes
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS business_graph_edges_admin_all ON public.business_graph_edges;
CREATE POLICY business_graph_edges_admin_all
  ON public.business_graph_edges
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS business_graph_aliases_admin_all ON public.business_graph_aliases;
CREATE POLICY business_graph_aliases_admin_all
  ON public.business_graph_aliases
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS business_graph_node_sources_admin_all ON public.business_graph_node_sources;
CREATE POLICY business_graph_node_sources_admin_all
  ON public.business_graph_node_sources
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS business_graph_events_admin_all ON public.business_graph_events;
CREATE POLICY business_graph_events_admin_all
  ON public.business_graph_events
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
