-- Schema + RLS validation for Stage 2B.1 dry-run
\set ON_ERROR_STOP on

\echo '=== TABLES ==='
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'lia_oi_%'
ORDER BY 1;

\echo '=== PUBLIC.opportunities must NOT be created by OI migrations ==='
SELECT EXISTS (
  SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='opportunities'
) AS public_opportunities_exists;

\echo '=== INDEXES (key ones) ==='
SELECT indexname
FROM pg_indexes
WHERE schemaname='public'
  AND indexname IN (
    'lia_oi_opportunities_fingerprint_uidx',
    'lia_oi_opportunities_canonical_url_idx',
    'lia_oi_opportunities_status_idx',
    'lia_oi_opportunities_bucket_idx',
    'lia_oi_opportunities_region_idx',
    'lia_oi_opportunities_industry_idx',
    'lia_oi_opportunities_first_seen_idx',
    'lia_oi_opportunities_last_seen_idx',
    'lia_oi_opportunities_score_opp_idx',
    'lia_oi_opportunities_created_at_idx',
    'lia_oi_opportunities_search_run_idx'
  )
ORDER BY 1;

\echo '=== is_admin signature ==='
SELECT pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname='is_admin';

\echo '=== RLS enabled on lia_oi_* tables ==='
SELECT relname, relrowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND relname LIKE 'lia_oi_%' AND relkind='r'
ORDER BY 1;

\echo '=== POLICIES ==='
SELECT tablename, policyname, roles::text, cmd
FROM pg_policies
WHERE tablename LIKE 'lia_oi_%'
ORDER BY 1,2;

-- Seed test users (fake, no PII)
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'admin@test.local', '{"full_name":"Test Admin"}'),
  ('22222222-2222-4222-8222-222222222222', 'user@test.local', '{"full_name":"Test User"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('11111111-1111-4111-8111-111111111111', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('22222222-2222-4222-8222-222222222222', 'entrepreneur')
ON CONFLICT DO NOTHING;

INSERT INTO public.lia_oi_opportunities (
  id, title, description, status, canonical_key, fingerprint, asking_price
) VALUES (
  'cand-seed-1', 'Seed cafe', 'test', 'NEW', 'seed-key', 'fp-seed-1', 25000000
) ON CONFLICT (id) DO NOTHING;

\echo '=== RLS: anon cannot see ==='
BEGIN;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SET LOCAL ROLE anon;
SELECT count(*) AS anon_count FROM public.lia_oi_opportunities;
ROLLBACK;

\echo '=== RLS: authenticated non-admin cannot see ==='
BEGIN;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
SET LOCAL ROLE authenticated;
SELECT count(*) AS non_admin_count FROM public.lia_oi_opportunities;
SELECT public.is_admin(auth.uid()) AS non_admin_is_admin;
ROLLBACK;

\echo '=== RLS: admin can read/write ==='
BEGIN;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
SET LOCAL ROLE authenticated;
SELECT public.is_admin(auth.uid()) AS admin_is_admin;
SELECT count(*) AS admin_count FROM public.lia_oi_opportunities;
INSERT INTO public.lia_oi_reports (id, kind, title, body)
VALUES ('rep-rls-1', 'search_result', 'RLS report', 'ok')
ON CONFLICT (id) DO NOTHING;
SELECT count(*) AS admin_reports FROM public.lia_oi_reports;
ROLLBACK;

\echo '=== SERVICE ROLE (BYPASSRLS) ==='
BEGIN;
SET LOCAL ROLE service_role;
SELECT count(*) AS service_count FROM public.lia_oi_opportunities;
ROLLBACK;

\echo '=== ASSIGNMENT STATUS CHECK ==='
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.lia_oi_assignments'::regclass AND contype='c';

\echo '=== FINGERPRINT UNIQUE ENFORCED ==='
DO $$
BEGIN
  BEGIN
    INSERT INTO public.lia_oi_opportunities (
      id, title, description, status, canonical_key, fingerprint
    ) VALUES ('cand-dup', 'dup', 'x', 'NEW', 'other', 'fp-seed-1');
    RAISE EXCEPTION 'EXPECTED_UNIQUE_VIOLATION_NOT_RAISED';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'fingerprint unique OK';
  END;
END $$;

\echo 'SCHEMA_RLS_OK'
