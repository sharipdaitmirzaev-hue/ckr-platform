# Business Graph — Stage 3A Foundation

**Статус:** архитектура + prepared migration/tests.  
**Production apply:** НЕ выполнять без явного подтверждения владельца.  
**Matching / Synthesis / Scheduler:** НЕ входят в Stage 3A.

---

## 1. Аудит: что уже есть

### Marketplace / CRM (использовать как источники узлов, не дублировать)

| Таблица | Назначение | Node type(s) |
|---|---|---|
| `profiles` | пользователь | PERSON |
| `organizations` | партнёрская орг. | COMPANY |
| `projects` | проект ЦКР | PROJECT |
| `opportunities` | публичный каталог ресурсов | ASSET / PROPERTY / SUPPLY / DEMAND / SUPPORT (по типу) |
| `investment_offers` | предложение капитала | CAPITAL |
| `expert_profiles` | эксперт | EXPERTISE / PERSON |
| `crm_contacts` / `leads` | CRM | PERSON / MARKET_SIGNAL (осторожно) |
| `deals` / `applications` | взаимодействия | предпочтительно **edges**, не nodes |
| `documents` | доказательства | provenance на edge/node_source |

### LIA OI (мост, без переписывания)

| Таблица | Роль |
|---|---|
| `lia_oi_opportunities` | → BusinessNode (`source_type=lia_oi_opportunity`) |
| `lia_oi_sources` | → `business_graph_node_sources` |
| fingerprint / canonical_url / source_object_id | identity keys |
| matching_readiness / data_quality_score | переносятся как метрики узла, **не** как match-результат |
| hypotheses | будущий HYPOTHESIS edge/opportunity — не Matching Engine |

### Чего нет в БД

- ИНН / ОГРН колонок (identity resolver должен поддерживать их как optional keys)
- FK OI ↔ marketplace
- любой graph store (`business_graph_*` отсутствует)

### Конфликт имён

`public.opportunities` ≠ `lia_oi_opportunities` ≠ graph node type `OPPORTUNITY`.  
В коде всегда квалифицировать: marketplace listing / OI candidate / graph OPPORTUNITY.

---

## 2. Принцип архитектуры

Business Graph — **overlay** на Postgres:

- не копия всей сущности;
- soft reference: `internal_entity_type` + `internal_entity_id` и/или `source_type` + `source_id`;
- additive tables only;
- не ломает `lia_oi_*` и marketplace RLS/логику.

```text
CKR entity / LIA OI candidate
        │
        ▼
  identity resolve ──► BusinessNode (1)
        │
        ▼
  BusinessEdge (FACT|INFERENCE|ESTIMATE|UNKNOWN)
        │
        ▼
  events / aliases / node_sources
```

---

## 3. Node types (расширяемый text + catalog)

Рекомендуемые значения (не жёсткий PG enum):

`CAPITAL`, `PROJECT`, `BUSINESS`, `ASSET`, `PROPERTY`, `EQUIPMENT`, `SUPPLY`, `DEMAND`, `PARTNER`, `EXPERTISE`, `SUPPORT`, `LICENSE`, `INFRASTRUCTURE`, `MARKET_SIGNAL`, `OPPORTUNITY`, `CONTRACT`, `COMPANY`, `PERSON`, `LOCATION`

Новые типы добавляются записью в catalog / кодом без destructive migration.

### Mapping существующих таблиц → node types

| Источник | node_type | Примечание |
|---|---|---|
| `investment_offers` | CAPITAL | лимиты в structured_data |
| `projects` | PROJECT | |
| действующий бизнес (если появится) | BUSINESS | |
| marketplace opportunity (торги/актив) | ASSET / PROPERTY | по category/type |
| оборудование | EQUIPMENT | |
| поставка/товар | SUPPLY | |
| закупка/спрос | DEMAND | OI procurement часто DEMAND |
| org / partner | COMPANY / PARTNER | |
| expert_profiles | EXPERTISE (+ PERSON) | |
| господдержка (OI/support) | SUPPORT | |
| лицензии (будущее) | LICENSE | |
| инфра | INFRASTRUCTURE | |
| OI news/signal | MARKET_SIGNAL | |
| собранная конструкция | OPPORTUNITY | DERIVED_FROM несколько узлов |
| договор/оффтейк | CONTRACT | |
| profiles / контакт | PERSON | |
| регион/город | LOCATION | нормализованный geo-узел |

---

## 4. Relationship types (text + catalog)

Не PG enum. Known set в TypeScript + optional catalog table.

Базовый набор Stage 3A:

`CAN_FINANCE`, `CAN_INVEST_IN`, `CAN_PARTNER_WITH`, `REQUIRES`, `REQUIRED_BY`, `SUPPLIES`, `BUYS`, `LOCATED_IN`, `SUITABLE_FOR`, `SUPPORTED_BY`, `DEPENDS_ON`, `COMPETES_WITH`, `COMPLEMENTS`, `CAN_MANAGE`, `CAN_SELL_TO`, `CAN_BUY_FROM`, `RELATED_TO`, `DERIVED_FROM`, `CONFIRMS`, `CONTRADICTS`, `OWNS`, `OPERATES`, `NEEDS`, `HAS`, `SERVES`, `MATCHES`, `CREATES_DEMAND_FOR`

`MATCHES` зарезервирован для будущего Matching Engine (Stage 3A только хранит тип, не считает match).

---

## 5. Schema (proposed)

### `business_graph_nodes`

| Column | Notes |
|---|---|
| id uuid PK | |
| node_type text | catalog-backed |
| title, description | |
| source_type, source_id, source_url | внешний/OI источник |
| internal_entity_type, internal_entity_id | marketplace FK soft |
| country, region, city, location_data jsonb | |
| status | ACTIVE/ARCHIVED/… |
| visibility | PUBLIC/USER/INTERNAL/OWNER_ONLY |
| structured_data jsonb | type-specific payload, не вся копия entity |
| data_confidence numeric | достоверность данных |
| data_quality_score numeric | completeness |
| opportunity_attractiveness numeric null | **отдельно** от confidence |
| fingerprint text | graph-level identity |
| created_at, updated_at, first_seen_at, last_seen_at | |

Unique: `(source_type, source_id)` where both set;  
Unique: `(internal_entity_type, internal_entity_id)` where both set;  
Unique partial: fingerprint.

### `business_graph_edges`

| Column | Notes |
|---|---|
| id uuid PK | |
| source_node_id, target_node_id | FK → nodes |
| relationship_type text | |
| confidence numeric | **relationship** confidence |
| strength numeric | optional 0–1 |
| status | PROPOSED/ACTIVE/CONFIRMED/REJECTED/ARCHIVED |
| match_class | HARD/SOFT/HYPOTHESIS **nullable** (prep for Matching) |
| provenance_type | FACT/INFERENCE/ESTIMATE/UNKNOWN |
| reasoning_summary text | |
| source, source_url | |
| created_by_kind | SYSTEM/LIA/OWNER/USER |
| created_by_user_id uuid null | |
| valid_from, valid_to | temporal |
| is_current boolean | |
| created_at, updated_at | |

### `business_graph_aliases`

node_id, alias, normalized_alias, source, confidence, created_at

### `business_graph_node_sources`

node_id, source_type, source_id, source_url, title, snippet, is_primary, meta jsonb

### `business_graph_events`

event_type, node_id, edge_id, payload jsonb, actor_kind, actor_user_id, created_at  
Types: NODE_CREATED, NODE_UPDATED, EDGE_CREATED, EDGE_UPDATED, EDGE_CONFIRMED, EDGE_REJECTED, IDENTITY_MERGED, ALIAS_ADDED, OWNER_COMMENT

### Optional catalog (lightweight)

`business_graph_node_type_catalog`, `business_graph_relationship_type_catalog` — seed known values; not required for writes.

---

## 6. Confidence model (не смешивать)

| Score | Где | Смысл |
|---|---|---|
| data_confidence | node | насколько достоверны исходные данные |
| data_quality_score | node | полнота structured fields |
| relationship confidence | edge | уверенность в связи |
| opportunity_attractiveness | node (OPPORTUNITY) | экономический потенциал — **не** confidence |

---

## 7. Provenance

На каждом edge: `provenance_type` + `reasoning_summary` + source.  
Inference **никогда** не записывается как FACT.  
Owner confirm меняет `status` → CONFIRMED, не provenance исходного inference (история в events).

---

## 8. Identity resolver

Порядок ключей (от сильного к слабому):

1. `(source_type, source_id)` exact  
2. `(internal_entity_type, internal_entity_id)` exact  
3. graph `fingerprint`  
4. official id в structured_data / aliases (`inn`, `ogrn`, `procurement_id`, `lot_id`)  
5. canonical_url  
6. phone / email (normalized)  
7. normalized name + region — **не merge** на Stage 3A (только aliases / будущий candidate)

Слабый identity **не** пишет `fingerprint` (чтобы unique index не склеивал одноимённые компании).  
**Не** merge агрессивно при слабом confidence.

---

## 9. LIA OI bridge

```text
lia_oi_opportunities
  → upsert BusinessNode
      source_type = 'lia_oi_opportunity'
      source_id = opportunity.id
      fingerprint = opportunity.fingerprint || hash(canonical_url|source_object_id)
      node_type = map(opportunityType) // PROCUREMENT→DEMAND, AUCTION_ASSET→ASSET, …
      data_confidence = sourceConfidence
      data_quality_score = dataQualityScore
      opportunity_attractiveness = score.opportunity  // separate
  → upsert node_sources from lia_oi_sources
```

Повторный discovery: тот же fingerprint/source → update, не duplicate.

OI candidate **не** автоматически становится graph OPPORTUNITY-конструкцией.  
Собранная OPPORTUNITY (CAPITAL+PROPERTY+…) создаётся отдельно и связывается `DERIVED_FROM`.

---

## 10. Internal CKR bridge

```text
projects.id → node PROJECT (internal_entity_type='projects')
investment_offers → CAPITAL
organizations → COMPANY
profiles → PERSON
expert_profiles → EXPERTISE
marketplace opportunities → typed node by category (never confuse with OI)
```

Детали сущности остаются в исходной таблице; graph хранит ссылку + компактный structured_data snapshot для поиска.

---

## 11. Temporal

Edges: `valid_from`, `valid_to`, `is_current`.  
При закрытии тендера/продаже: `is_current=false`, `valid_to=now()`, status ARCHIVED — **без DELETE**.  
Node history через events + optional snapshots later.

---

## 12. HARD / SOFT / HYPOTHESIS

Поле `match_class` на edge (nullable).  
Stage 3A: можно заполнять вручную/fixture.  
Matching Engine не реализуется.

---

## 13. RLS / visibility

| visibility | Кто читает |
|---|---|
| PUBLIC | authenticated + anon select (ограниченный набор публичных узлов) |
| USER | владелец связанной сущности + admin |
| INTERNAL | admin/operator |
| OWNER_ONLY | platform admin (`is_admin`) only — LIA OI overlay |

Default для OI-derived nodes: **OWNER_ONLY**.  
Writes: service role / admin.  
Owner confirm/reject edges: admin (owner cabinet).

Не раскрывать: reasoning_summary для OWNER_ONLY, private contacts, investment private profiles.

---

## 14. Owner UI

Route: `/admin/owner/graph` (owner-only через `requireLiaOiOwner`)

Stage 3A MVP:

- поиск nodes
- карточка node (тип, источники, aliases, scores)
- in/out edges
- provenance / confidence
- history events
- данные из in-memory fixture до apply migration
- confirm/reject — API в `BusinessGraphService` (server actions после apply)

Без тяжёлой force-directed visualization.

---

## 15. Service API

`BusinessGraphService`:

- getNode / findNodes / getEdges / getNeighbors  
- createOrUpdateNode / createOrUpdateEdge  
- resolveIdentity  
- addAlias  
- getNodeHistory / getEdgeHistory  
- confirmEdge / rejectEdge / comment  
- bridgeFromOiCandidate / bridgeFromInternalEntity  

Store mode: `memory` (tests) | `supabase` (после apply migration).

---

## 16. Sample scenario (fixture)

CAPITAL (30M) → CAN_FINANCE → PROJECT  
PROPERTY → SUITABLE_FOR → PROJECT  
EQUIPMENT → REQUIRED_BY → PROJECT  
SUPPORT → SUPPORTED_BY → PROJECT  
DEMAND → CREATES_DEMAND_FOR → PROJECT  
OPPORTUNITY → DERIVED_FROM → {CAPITAL, PROPERTY, EQUIPMENT, SUPPORT, DEMAND, PROJECT}

---

## 17. Risks

1. Путаница трёх «opportunity» понятий — нужны чёткие имена в UI.  
2. Слабая marketplace identity (нет ИНН) → ложные merge.  
3. Premature Matching на слабых edges.  
4. RLS leak OI в public API.  
5. JSONB structured_data раздувание — держать snapshot компактным.

---

## 18. Готовность к Matching Engine

**Да, как фундамент:** nodes/edges/provenance/confidence/match_class/identity.  
**Нет, как продукт:** нет scoring multi-hop, нет auto HARD/SOFT pipeline, нет recommendations.

---

## 19. Production

Migration файл подготовлен с баннером **DO NOT APPLY**.  
Apply только после отдельного подтверждения владельца.

## 20. Implementation status (после подтверждения)

1. ✅ Local dry-run: `npm run test:business-graph-dryrun` (Docker Postgres).  
2. ✅ Supabase adapter: `SupabaseBusinessGraphRepository` + `BUSINESS_GRAPH_STORE`.  
3. ✅ Server actions: confirm/reject/comment на `/admin/owner/graph`.  
4. ✅ Batch bridge helpers: `src/lib/business-graph/sync.ts` (без Matching / scheduler).  
5. ✅ RLS в migration + dry-run validate.  
6. Production apply: `scripts/apply-business-graph-stage3a-production.sh`  
   с `CKR_CONFIRM_BUSINESS_GRAPH_APPLY=YES` — **не включает** `BUSINESS_GRAPH_STORE=supabase` автоматически.

Default runtime: `BUSINESS_GRAPH_STORE=memory` (fixture UI).
