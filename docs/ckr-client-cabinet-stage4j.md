# Stage 4J — Simple client cabinet after request

## Audit (before)

| Area | Finding |
|------|---------|
| `/dashboard` | Had «Сейчас ЦКР» but mixed with technical leftovers; weak empty state |
| Request detail | Showed events/titles that could leak technical wording |
| Comments | Client reply existed via `addCkrRequestCommentAction`, event titled «Ответ клиенту» even for client posts |
| BASIC nav | OK (4 items) |
| STANDARD nav | Included «Рассказать идею» + company/needs/feed — slightly duplicated with My Requests |
| TINDA | Backend FIND_BUYER / SEEK_BUYER intact; UI needed human mapping |

## Decision

- No migration / no new entities
- Reuse `ckr_requests`, CLIENT comments/events, `next_step_public`
- Human presentation helpers in `client-presentation.ts`
- Supplement idea = CLIENT comment + event (does not overwrite body)

## After

1. BASIC home: greeting → your request → progress → status → Сейчас ЦКР → Что нужно от вас → last CKR message
2. Detail: idea / now / need / messages / reply / supplement / human history
3. STANDARD menu without heavy idea item; idea CTA remains in header/empty states
