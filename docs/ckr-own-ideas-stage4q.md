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

## Stage 4Q.3 live signal quality gate

Плохие сигналы отсекаются **до** пары ASSET×DEMAND. 0 идей — успешный результат.

- Page type: `DETAIL | LISTING | CATEGORY | SEARCH_RESULTS | MIRROR | LANDING | UNKNOWN`. В идею как FACT идёт только `DETAIL`. `TradeList.aspx`, category «тендеры на белье в СКФО», индекс закупок, банковская главная — не FACT.
- FACT только при достаточном наборе полей (notice/lot id, предмет/объект, заказчик или location, регион, URL; для закупки — дата и deadline/status). Иначе INFERENCE или reject. Домен поисковой выдачи не повышает до FACT.
- География: страна / ФО / субъект / город. «Российская Федерация» ≠ совместимость с любым регионом. Орёл × СКФО — `INCOMPATIBLE` по умолчанию.
- Отрасль: UNKNOWN asset category не клеится к произвольному DEMAND. Экскаватор × земляные — compatible; экскаватор × бельё — нет.
- Expired/closed/cancelled/completed — reject. UNKNOWN deadline у закупки — не live FACT.
- Идея: ≥2 связанных сигнала, ≥1 DETAIL FACT, второй FACT или сильный INFERENCE, отрасль+география ок. Promising / «Перспективная» — минимум 2 live FACT.
- Финансирование проверяется после жизнеспособной пары. Generic bank landing → `financeAvailability=UNKNOWN`.
- Economics: conservative, UNKNOWN остаётся UNKNOWN.
- Единый run budget: `maxSearches=12`, `maxExternalCalls=8` на весь owner run (catalog+builder). Метрики: `catalogSearches`, `builderSearches`, `catalogExternalCalls`, `builderExternalCalls`, `totalExternalCalls`. Лимиты не увеличены. In-memory lookup не считается external call.

Fixture только в unit/E2E tests. Нет второго production market run в этом этапе. Нет Scheduler.

## Stage 4Q.4 DETAIL FACT acquisition

Поисковый snippet — discovery candidate, не FACT.

Путь: Serper/web_api hit → candidate URL → official DETAIL (zakupki.gov.ru / torgi.gov.ru / ЕФРСБ / мсп.рф) → structured extraction (существующие LIA OI resolver/extractors + `safeFetch`) → validation → FACT / INFERENCE / reject.

Агрегатор только для discovery. Если есть номер закупки/лота — резолв в официальный URL. Иначе reject/INFERENCE. Нет нового search provider, crawler, Scheduler, Matching, Synthesis.

FACT хранит per-field provenance: value, source/canonical URL, domain, fetched_at, publication date, source type, confidence, verification status. Отсутствие цены/срока не выдумывается.

Приоритет discovery: Республика Дагестан → СКФО → РФ только при явной переносимости. «Российская Федерация» ≠ Дагестан. Cross-region требует `crossRegionReason`.

Пары: demand-first, затем asset-first best-fit. Не декартово произведение.

Detail resolution расходует тот же budget (`maxSearches=12`, `maxExternalCalls=8`, `timeoutMs=15000`). Лучше 0 FACT, чем обход лимита.

Метрики: `discoveryCandidates`, `detailResolutionAttempts`, `officialDetailsResolved`, `aggregatorCandidates`, `aggregatorToOfficialResolved`, `detailValidationRejected`, `liveFacts`, `budgetExhausted` — плюс прежние 4Q.3.

E2E инжектит discovery snippet и проверяет путь resolution, а не готовый FACT в builder. Live Serper в CI не считается доказательством, если ключ не настроен (`LIVE_SEARCH_SKIPPED_NO_SECRETS`).

Существующие 9 production ideas не менять. Нет merge/deploy/production run в этом этапе.

## Stage 4Q.4.1 live resolution budget

Run 3 (`245354ef-…`) потратил `timeoutMs=15000` на discovery: 3 `adapter.search` × до 3 Serper (локальный timeout 12s), каждый adapter считался как 1 external call. `detailResolutionAttempts=0`.

4Q.4.1:

- Единица `externalCalls` — фактический HTTP (Serper query / `safeFetch` / injected hook stand-in), не вызов `adapter.search`.
- Shared `RunBudgetContext` (AsyncLocalStorage): Serper, official fetch, aggregator fetch.
- Discovery ≤ 4 HTTP; минимум 4 слота и `resolutionReserveMs=6000` для DETAIL.
- Interleaved: search → rank (Dagestan-first) → resolve best → продолжить discovery только при остатке.
- Adapter fan-out видит тот же budget и останавливается.
- Invariant: eligible official/detail URL + живой budget → `detailResolutionAttempts >= 1`.
- Метрики: `actualExternalHttpCalls`, `discoveryExternalCalls`, `resolutionExternalCalls`, `discoveryTimeMs`, `resolutionTimeMs`, `runWallTimeMs`, `discoveryStoppedForResolutionReserve`, `budgetRemainingAtFirstResolution`, `budgetExhaustedPhase`, bounded `candidateDiagnostics` (≤20, без секретов/HTML).
- `maxExternalCalls=8` не увеличен. `timeoutMs` остаётся 15000: deadline-aware `remainingMs` + reserve делают 1 search + 1 official fetch выполнимыми без 12s×N fan-out.
- Quality gates 4Q.3 не ослаблены. 0 FACT валиден. Fixture в production запрещён. Scheduler/Matching/auto-publish OFF.

OLD_TIMEOUT=15000. NEW_TIMEOUT=15000. WHY_REQUIRED=не меняли: проблема была в учёте и fan-out, не в абсолютной длительности одного search+fetch.

## Stage 4Q.4.2 official DETAIL fetch reliability

Run 4 (`c489e1f8-…`): `DETAIL_RESOLUTION_ATTEMPTS=2`, reserve сработал, но `OFFICIAL_DETAILS_RESOLVED=0`. Первый torgi DETAIL ушёл в `HTTP_ERROR`; фактически это был connect/TLS/response hang (~8s default), съевший resolution budget. До EXTRACTION очередь не доходила.

4Q.4.2:

- Search stack не менялся (Serper / LIA adapters / ranking / quality gates / RunBudgetContext / safeFetch).
- Bounded `OfficialDetailFetcher`: torgi.gov.ru предпочитает публичный JSON ` /new/api/public/lotcards/lot/{id} ` (тот же endpoint, что SPA), HTML — fallback только при shell/неверном content-type.
- `bankrot.fedresurs.ru` — та же abstraction (`fedresurs_html`); credentialed REST не включается (нет договора).
- `perDetailTimeoutMs=4000` внутри `timeoutMs=15000`. Один зависший DETAIL не блокирует очередь.
- Diagnostics: HTTP status, elapsedMs, strategy, error category (`HTTP_4XX` / `HTML_SHELL` / `CONNECT_TIMEOUT` / …). Без HTML/секретов.
- FACT только после official parse + существующие 4Q.3 gates. Цена не выдумывается.
- Dagestan discovery не трогали.

E2E: injected `fetchOfficial` — fetch/orchestration proof, не live torgi. Live read-only probe: DNS/TCP ок, TLS handshake timeout из cloud agent env.

## Stage 4Q.4.3 official source connectivity

Run 5 (`5ca5e57b-…`): 3 official `torgi_api` attempts → `CONNECT_TIMEOUT`, `OFFICIAL_DETAILS_RESOLVED=0`. Queue после fail работала. Budget 4Q.4.1 жив.

4Q.4.3:

- Search / quality / FACT / RunBudgetContext / `maxExternalCalls=8` / `timeoutMs=15000` не менялись.
- Read-only `scripts/diag-torgi-official-connectivity.mjs` (`npm run diag:torgi-connectivity`): DNS A/AAAA, TCP/TLS IPv4/IPv6, curl -4/-6, Node default vs Node IPv4. Без body, без Supabase, без market run.
- Live proof (cloud agent, unrestricted egress): DNS A=`95.167.245.141`, AAAA нет, TCP IPv4 ок (~2ms), TLS handshake hang (curl + openssl + Node). IPv6 не причина. Это не Node/Undici-only.
- `OfficialHttpTransport` только для OfficialDetailFetcher: `ipv4_preferred`, phase timeouts (connect / TLS / headers / body), тот же budget.
- Proxy/VPN не внедрялся: прямое TCP есть, ломается TLS на пути к torgi.gov.ru.
- HTML fallback по-прежнему только `HTML_SHELL` / `UNSUPPORTED_CONTENT_TYPE`, не на connect/TLS fail.
- Diagnostics: `IPV4_CONNECT_TIMEOUT` / `IPV6_CONNECT_TIMEOUT` / `TLS_HANDSHAKE_TIMEOUT` / `CONNECT_REFUSED` / `HEADERS_TIMEOUT` / `BODY_TIMEOUT`.
- Шестой production market run не запускался.

## Запреты

Нет auto-publish, outreach, заявок, Matching edges, Scheduler.

## Миграция

`supabase/migrations/20260823220000_ckr_own_ideas_stage4q.sql` — additive, RLS `is_admin`. Уже применена на staging и production.
