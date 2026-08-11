# Stage 4B — Personalized Feed «Для вас» v1

## Goal

User states needs (Stage 4A Need Profiles). CKR shows explainable recommendations from existing data.

**Not** Matching Engine / MATCHES edges / Synthesis / Scheduler / ML.

## Personalization source

`getActiveIntents(owner)` → ACTIVE Need Profiles.

Feed is computed **per need** (or “All” with `recommendation_for_need_profile_id` on each card).

## Candidate sources (user Feed)

| Source | Used in user Feed | Notes |
|--------|-------------------|-------|
| `projects` | yes | published/active/completed |
| `opportunities` | yes | published |
| `investment_offers` | yes | published |
| `expert_profiles` | yes | published |
| PUBLIC `need_profiles` | yes | demand/supply signals only |
| LIA OI | **no** | admin/owner RLS only |
| Business Graph | **no** | admin RLS; not Matching Engine |

## Intent coverage

See `src/lib/personalized-feed/mapping.ts`.

- **FULL:** INVEST, SEEK_INVESTMENT, BUY_PROPERTY, SEEK_PROJECT, SEEK_EXPERT, SEEK_EQUIPMENT
- **PARTIAL:** BUY_BUSINESS, SELL_*, SEEK_PARTNER, SEEK_SUPPLIER, SEEK_BUYER, SUPPLY, DEMAND
- **UNSUPPORTED (user):** SEEK_SUPPORT, SEEK_CONTRACT (data exists in LIA OI owner-only)

## Ranking (0–100)

| Component | Max |
|-----------|-----|
| intent compatibility | 30 |
| budget fit | 20 |
| region fit | 15 |
| industry fit | 15 |
| data quality | 10 |
| freshness | 5 |
| source confidence | 5 |

Hard filters: confirmed price > hard `budget_max`; closed/expired status/deadline.

UNKNOWN price → budgetFit=0 and copy «Цена не подтверждена» (never «подходит по бюджету»).

## Feedback

Table `feed_feedback_events` (migration `20260811200000_feed_feedback_stage4b.sql`).

Actions: interested / not_interested / saved / assigned_to_lia / open / impression.

`not_interested` hides item for user. SAVE/INTERESTED also best-effort `investor_interests`.

«Поручить Лии проверить» → feedback + operator `tasks` row. **No auto outreach.**

## UI

- `/dashboard/for-you`
- Dashboard widget «Для вас»
- Owner diagnostics `/admin/owner/feed`

## Apply

Feedback migration is prepared. Production apply only after explicit confirmation (same gated style as Stage 4A).

Recommendations are on-demand; only feedback is persisted.
