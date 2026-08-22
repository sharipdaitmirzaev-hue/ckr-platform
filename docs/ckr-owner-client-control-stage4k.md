# Stage 4K — Owner Inbox: manage client cabinet without a developer

## Audit

| Area | Finding |
|------|---------|
| Owner detail | Status / CLIENT / INTERNAL already worked |
| Missing | `next_step_public` editor, CUSTOM «Сейчас ЦКР», preview, templates |
| `next_step_public` | Exists since Stage 4G |
| CUSTOM activity | No existing field → additive `public_activity_text` |
| Permissions | Staff via `requireStaff` + DB `can_manage_ckr_inbox` |

## Decision

- One additive column: `public_activity_text` (empty = AUTO Stage 4J text)
- No new entity / no JSONB / no new roles
- Migration prepared, **not applied to production** without confirmation

## Controls added

1. Preview «Что видит клиент»
2. AUTO / CUSTOM «Сейчас ЦКР»
3. Edit / clear `next_step_public`
4. WAITING_CLIENT warning + optional confirm to set waiting
5. Templates + quick scenarios (UI only)
6. Clear CLIENT vs INTERNAL visual separation
