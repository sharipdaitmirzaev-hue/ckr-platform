# Stage 4C — Controlled Publish (LIA OI → User Marketplace / Feed)

## Summary

Owner-reviewed publish workflow:

`LIA FOUND → OWNER REVIEW → APPROVE → PUBLISHED user-safe opportunity → USER FEED`

Not Matching Engine. No automatic mass publish. `lia_oi_*` RLS stays OWNER_ONLY.

## Architecture

1. Quality gate selects eligible LIA OI cards into `publication_state=queued`.
2. Owner reviews at `/admin/owner/publishing`.
3. Approve creates/updates a row in existing `public.opportunities` with `source_type=lia_oi`.
4. Personalized Feed reads published marketplace opportunities as usual.
5. `SEEK_SUPPORT` / `SEEK_CONTRACT` coverage becomes `PARTIAL` via `support_program` / `procurement`.

## Schema (additive migration — not applied to production in this stage)

`supabase/migrations/20260811220000_lia_controlled_publish_stage4c.sql`

- New categories: `support_program`, `procurement`, `auction_asset`
- Provenance columns on `opportunities`
- `publication_state` + link on `lia_oi_opportunities`
- Audit table `lia_oi_publication_events`

## Security boundary

- Users never read `lia_oi_*` directly.
- Public payload is an explicit allowlist projection.
- Internal notes/scores/contacts/raw payloads are blocked.

## Owner actions

Approve / Reject / Edit / Recheck / Apply changes / Reject changes.

## Tests

```bash
npm run test:controlled-publish-stage4c
npm run test:personalized-feed-stage4b
npm run dryrun:controlled-publish-stage4c
```
