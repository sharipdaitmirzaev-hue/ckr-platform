# Need Profile / Universal Intent — Stage 4A

**Статус:** foundation в ветке. Production apply — только после отдельного подтверждения.  
**Не входит:** Matching Engine, Feed «Для вас», Synthesis, Scheduler.

---

## 1. Аудит (почему не дублируем)

| Существующее | Роль | Почему недостаточно |
|---|---|---|
| `user_roles` | кто пользователь | один/несколько ролей ≠ что ищет |
| `investor_interests` | закладки на сущности | не критерии поиска |
| `FIRST_INTENT_PROMPTS` | UI CTA | не persistence |
| OI `plan_json` soft prefs | поиск Лии owner | не user Need Profile |
| `projects` / `opportunities` / `investment_offers` | предложения | supply-side, не need |
| Business Graph | связи | нужен мост от needs, не замена |

**Вывод:** новая additive сущность `need_profiles` + catalog intent types.

---

## 2. Schema

### `need_profile_intent_catalog`
code (PK), label, description, is_active

### `need_profiles`
- id, intent_type (text → catalog)
- title, description
- owner_type: `user` | `organization` | `project`
- owner_id (uuid, soft ref)
- status: DRAFT | ACTIVE | PAUSED | FULFILLED | ARCHIVED
- budget_min/max, currency
- regions text[], industries text[], keywords text[]
- criteria jsonb (type-specific)
- visibility: PRIVATE | CKR_ONLY | PUBLIC
- priority, time_horizon, risk_preference (nullable)
- matching_enabled bool default true
- last_matched_at null (prep)
- context_group_id (связанные intents из одного NL)
- fingerprint (duplicate protection)
- source: manual | lia_nl | onboarding
- created_by → profiles
- created_at, updated_at

### `need_profile_events`
history: CREATED, UPDATED, STATUS_CHANGED, CONFIRMED_FROM_NL, GRAPH_BRIDGED, ARCHIVED

---

## 3. Intent → Graph (без MATCHES)

| Intent | Graph node_type |
|---|---|
| INVEST | CAPITAL |
| SEEK_INVESTMENT | DEMAND |
| BUY_BUSINESS | DEMAND |
| SELL_BUSINESS | BUSINESS |
| BUY_PROPERTY | DEMAND |
| SELL_PROPERTY | PROPERTY |
| SEEK_PROJECT | DEMAND |
| SEEK_PARTNER | PARTNER |
| SEEK_SUPPLIER | DEMAND |
| SEEK_BUYER | SUPPLY |
| SEEK_EXPERT | DEMAND |
| SEEK_EQUIPMENT | DEMAND |
| SELL_EQUIPMENT | EQUIPMENT |
| SEEK_SUPPORT | DEMAND |
| SEEK_CONTRACT | DEMAND |
| SUPPLY | SUPPLY |
| DEMAND | DEMAND |

Bridge: `source_type=need_profile`, `source_id=need.id`. No MATCHES edges.

---

## 4. RLS

- Owner (user / org member / project owner): CRUD own
- Admin/operator: all
- PUBLIC: select by authenticated
- PRIVATE / CKR_ONLY: owner + admin/operator + service role only
- Writes: authenticated owner only

---

## 5. NL flow

1. User text → `parseNeedProfileDrafts()` (rules + optional LIA later)
2. Return draft(s) for confirmation
3. User confirms → `createNeedProfile`
4. Optional Graph bridge on ACTIVE

Scenario D: multiple drafts + shared `context_group_id`.

---

## 6. API

`NeedProfileService`: create, update, setStatus, getActiveIntents, listByOwner, parseDrafts, confirmDrafts, bridgeToGraph

Routes: `/dashboard/needs`, `/dashboard/needs/new`, `/dashboard/needs/[id]`

---

## 7. Feed v1 readiness

`getActiveIntents(owner)` returns ACTIVE (+ optional CKR_ONLY/PUBLIC filter). Feed Stage later consumes this — not built in 4A.
