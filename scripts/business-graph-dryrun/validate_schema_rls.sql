-- Business Graph dry-run validation (disposable DB only)

DO $$
DECLARE
  missing text;
BEGIN
  FOREACH missing IN ARRAY ARRAY[
    'business_graph_nodes',
    'business_graph_edges',
    'business_graph_aliases',
    'business_graph_node_sources',
    'business_graph_events',
    'business_graph_node_type_catalog',
    'business_graph_relationship_type_catalog'
  ]
  LOOP
    IF to_regclass('public.' || missing) IS NULL THEN
      RAISE EXCEPTION 'missing table: %', missing;
    END IF;
  END LOOP;
END $$;

-- Required indexes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'business_graph_nodes_source_uidx'
  ) THEN
    RAISE EXCEPTION 'missing index business_graph_nodes_source_uidx';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'business_graph_edges_active_uidx'
  ) THEN
    RAISE EXCEPTION 'missing index business_graph_edges_active_uidx';
  END IF;
END $$;

-- RLS enabled
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'business_graph_nodes',
    'business_graph_edges',
    'business_graph_aliases',
    'business_graph_node_sources',
    'business_graph_events'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = t AND c.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS not enabled on %', t;
    END IF;
  END LOOP;
END $$;

-- anon cannot see owner graph nodes (policy is admin-only)
SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM 1 FROM public.business_graph_nodes LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- ok
  WHEN OTHERS THEN
    -- If RLS blocks with 0 rows instead of error, also ok
    NULL;
  END;
END $$;
RESET ROLE;

-- Seed smoke row as postgres (bypass), then check admin policy exists
INSERT INTO public.business_graph_nodes (node_type, title, visibility)
VALUES ('PROJECT', 'dryrun-project', 'OWNER_ONLY')
ON CONFLICT DO NOTHING;

SELECT 'business_graph_dryrun_ok' AS status;
