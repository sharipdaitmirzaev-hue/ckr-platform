# Stage 4Q — Собственные идеи ЦКР

Proactive Opportunity Builder. Owner-only. Manual run. No Matching / Synthesis / Scheduler.

## SoT

Таблицы `ckr_own_ideas` + `ckr_own_idea_runs`.

Почему не `projects`: marketplace supply, публичный slug, чужой жизненный цикл.  
Почему не `ckr_requests IDEA`: это клиентская идея (4H).  
Почему не `lia_oi_opportunities`: внешние сигналы, не авторская связка ЦКР.

## Stage 4Q.1 persistence

Live owner UI SoT = Supabase. `memoryOwnIdeaStore` только для unit-тестов (`CKR_OWN_IDEAS_STORE=memory`, не production).

Read/write path:

| Surface | Read | Write |
| --- | --- | --- |
| `/admin/owner/own-ideas` | `getOwnIdeaStore().list()` → `ckr_own_ideas` | — |
| `/admin/owner/own-ideas/[id]` | `.get(id)` | — |
| diagnostics | `.lastRun()` → `ckr_own_idea_runs` | — |
| `findNewOwnIdeasAction` | `.list()` existing for dedup/rediscovery | `.saveRun(running)` then `.upsert` ideas then `.saveRun(ok/partial/failed)` |
| owner review actions | `.get(id)` | `.upsert` with locks + events |
| rediscovery | existing from DB list | upsert same id; locked title/essence/economics/rating preserved |
| staging E2E | `createSupabaseOwnIdeaStore(admin)` | same + exact-ID delete |

`persist.ts` — тонкая обёртка над supabase-store для E2E cleanup.

Failure safety: если run записан, а idea upsert падает — `metrics.persistStatus` = `partial`/`failed`. UI не показывает ложный success.

Новой миграции 4Q.1 нет.

## Stage 4Q.2 live catalog

Owner action `findNewOwnIdeasAction` больше не склеивает fixture-каталоги.

Live path: `buildOwnIdeaCatalog()` → LIA OI adapters (торги / закупки / поддержка) с бюджетами 4Q. Stub/fixture/example.com/каталог/expired отбрасываются. 0 сигналов — допустимый результат.

`CKR_OWN_IDEAS_CATALOG=fixture` запрещён в production (как memory store).

Связка ASSET×DEMAND только при совместимой отрасли/регионе или пересечении title. Cartesian cross-industry больше не создаёт идеи.

Quality: «Перспективная» только при ≥2 живых FACT (не placeholder URL) и не UNKNOWN прибыли. Fixture unit-тесты остаются на `runOwnIdeaBuilder({ catalog })`.

Нет Scheduler / Matching / auto-publish.

## Запреты

Нет auto-publish, outreach, заявок, Matching edges, Scheduler.

## Миграция

`supabase/migrations/20260823220000_ckr_own_ideas_stage4q.sql` — additive, RLS `is_admin`. Уже применена на staging и production.
