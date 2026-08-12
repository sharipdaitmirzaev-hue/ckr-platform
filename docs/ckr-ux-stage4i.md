# Stage 4I — Public UX consolidation (audit + changes)

## Audit (before)

| Area | Finding |
|------|---------|
| Homepage `/` | Full marketplace: hero + how-it-works + roles + projects/opportunities/experts/investments cards + TINDA case + LIA entry |
| `mainNav` | Heavy catalog menu in header (projects, opportunities, investments, experts, …) |
| `/idea` | Stage 4H form existed; contacts after submit; copy still “marketplace-adjacent” |
| Login/register | Register pushed LIA-first journey |
| BASIC/STANDARD/ADVANCED | Already in `resolveDashboardNav` (Stage 4H) |
| CKR Inbox | Owner Inbox + `ckr_requests` intact |
| Duplicates (UX) | Public catalogs vs cabinet tools; marketplace `applications` vs `ckr_requests` vs partnerships — kept separate in data, not merged |

## Decision

- No new entities / no migration.
- Reuse Stage 4H: `PUBLIC IDEA → ckr_requests → claim → cabinet`.
- Hide complexity on public first screen only; catalogs remain by URL.

## After (UX)

1. `/` — chrome-free: logo, full name, motto, short mission, two CTAs.
2. `/idea` — name + free-text idea → optional contacts (phone/email/Telegram or skip) → thanks + create account / later.
3. Public header (non-landing) — light: О ЦКР, Контакты, idea CTA, Войти.
4. Menus use human labels (“Что вам нужно”, “Возможности для вас”).
5. LIA stays available at `/lia` but is not required for entry/auth/idea.
