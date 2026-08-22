# LIA OI Stage 2B.1 — isolated migration dry-run

Проверка Stage 1 + Stage 2B migrations и `SupabaseLiaOiStore` на **временной** локальной Postgres + PostgREST.

**Не использует production Supabase.** Не меняет `/etc/ckr/ckr.env`.

## Что нужно

- Local PostgreSQL (в dry-run: DB `lia_oi_dryrun` на `127.0.0.1:5432`)
- PostgREST на `:54321` + tiny `/rest/v1` proxy на `:54322` (для supabase-js)
- Disposable credentials only

## Порядок

1. Bootstrap: `00_supabase_compat_bootstrap.sql`
2. Baseline: `20260325120000_profiles_and_roles.sql` (`is_admin`)
3. `20260810220000_lia_oi_stage1.sql`
4. `20260811083000_lia_oi_stage2b.sql`
5. Schema/RLS: `validate_schema_rls.sql`
6. Integration: `npm run test:lia-oi-dryrun`
7. Restart: `npm run test:lia-oi-dryrun:restart`

## Cleanup

```bash
sudo -u postgres psql -c 'DROP DATABASE IF EXISTS lia_oi_dryrun;'
```
