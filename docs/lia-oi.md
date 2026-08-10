# LIA Opportunity Intelligence (Owner)

Закрытый контур владельца: поиск и разбор бизнес-возможностей.

- UI: `/admin/owner/lia`
- API: `/api/lia/oi/*` (только platform admin через `requireLiaOiOwner` / `withOiOwner`)
- Этап 1: stub pipeline + in-memory store
- Этап 2A: LIVE через существующий **Serper / WebSearchProvider**

---

## Режимы: STUB и LIVE

| Режим | Когда | Источник |
|---|---|---|
| **STUB** | нет ключа / `LIA_OI_SEARCH_MODE=stub` / provider ≠ `web_api` | `StubInternetSearchProvider` |
| **LIVE** | `web_api` + `LIA_WEB_SEARCH_API_KEY` (+ auto или `LIA_OI_SEARCH_MODE=live`) | адаптер над `getWebSearchProvider()` → Serper |

UI всегда показывает баннер:

- `Внешний поиск: DEMO/STUB`
- или `Внешний поиск: LIVE — Serper`

Stub и live **не смешиваются** в одном run без маркировки `isStub` на карточке и источниках.

---

## Как включить LIVE (Serper)

Server-side env (например `/etc/ckr/ckr.env`):

```env
LIA_WEB_SEARCH_PROVIDER=web_api
LIA_WEB_SEARCH_ENGINE=serper
LIA_WEB_SEARCH_API_KEY=...          # только server-side
# опционально:
LIA_WEB_SEARCH_BASE_URL=https://google.serper.dev
LIA_OI_SEARCH_MODE=auto             # auto | stub | live
```

Перезапустить приложение после изменения env.

**Нельзя:** класть ключ в frontend, логи, git, БД, тексты ошибок пользователю.

### Как вернуть STUB

```env
LIA_OI_SEARCH_MODE=stub
# или убрать LIA_WEB_SEARCH_API_KEY
# или LIA_WEB_SEARCH_PROVIDER=mock
```

Если `LIA_OI_SEARCH_MODE=live`, но ключа нет — автоматический **fallback в STUB** с явным сообщением в UI.

---

## Pipeline

```text
Owner query
  → Search Planner (несколько гипотез / queries)
  → InternetSearchProvider (stub | live/Serper)
  → cheap filter
  → normalize + canonical URL
  → dedup (источники объединяются)
  → provenance (FACT / INFERENCE / ESTIMATE / UNKNOWN)
  → analyzer + explainable scoring
  → owner feed (/admin/owner/lia/opportunities)
```

LLM не получает «все сырые результаты подряд» — только отфильтрованный и нормализованный набор в пределах бюджетов.

---

## Лимиты (cost / quota)

`src/config/lia-oi.ts` → `LIA_OI_BUDGETS`:

| Ключ | Смысл | Default |
|---|---|---|
| `maxQueriesPerPlan` | max_queries_per_search | 6 |
| `maxResultsPerQuery` | max_results_per_query | 8 |
| `maxCandidatesPerRun` | max_candidates_per_request | 12 |
| `maxAiAnalysesPerRun` | analyses | 8 |
| `maxDeepAnalysesPerRun` | max_deep_analysis | 3 |
| `maxFetchesPerRun` | page fetch (safe-fetch) | **0** (выключено в 2A) |

При ошибке/quota/rate-limit Serper:

- Лия/OI не «падает» целиком
- owner видит: «Внешний поиск временно недоступен»
- деталь ошибки — только в безопасный server log (без API key)

Ориентир стоимости Serper: тарификация по числу search requests у вендора; один owner-запрос ≈ до `maxQueriesPerPlan` вызовов API.

---

## Secrets

- `LIA_WEB_SEARCH_API_KEY` читается только на сервере
- не логируется (`safeProviderErrorMessage` редактирует совпадения)
- не уходит в JSON ошибок API
- не сохраняется в in-memory store / БД

---

## SSRF / safe-fetch

`src/lib/http/safe-fetch.ts`:

- только http/https
- блок localhost / private IP / link-local / metadata
- DNS lookup + проверка адресов
- timeout, max bytes, content-type, limit redirects

В Stage 2A основной путь использует **Serper snippets** (page fetch выключен: `maxFetchesPerRun=0`). Утилита готова для будущего обогащения.

Любой HTML/text со страницы — **untrusted**; не может менять инструкции Лии.

---

## Persistence

Stage 2A: **InMemoryLiaOiStore** (`src/lib/lia/oi/store.ts`).

- SQL migration Stage 1 **не применять**
- `SupabaseLiaOiStore` — этап **2B** (после staging), не активирован
- Интерфейс: `src/lib/lia/oi/store-types.ts`

---

## Owner UI: первый live-тест

После добавления реального Serper key:

1. Убедиться, что на `/admin/owner/lia` баннер: **«Внешний поиск: LIVE — Serper»**
2. Открыть `/admin/owner/lia/search`
3. Запрос:

```text
Найди 10 перспективных бизнес-возможностей до 30 млн ₽ по России
```

4. Проверить: Search Plan с несколькими queries, raw/filtered/dedup stats, карточки с **реальными URL**, метка LIVE, дата обнаружения.

Альтернатива (server, без печати ключа) — вызвать owner UI; отдельный curl к Serper не требуется.

---

## Troubleshooting

| Симптом | Что проверить |
|---|---|
| Всегда STUB | `LIA_WEB_SEARCH_PROVIDER=web_api`, задан `LIA_WEB_SEARCH_API_KEY`, `LIA_OI_SEARCH_MODE` ≠ `stub` |
| «Внешний поиск временно недоступен» | квота/сеть Serper; server log `[lia-oi]` |
| Пустая лента в LIVE | ещё не запускали поиск (seed stub в LIVE отключён) |
| Mock вместо Serper | ключ пустой → фабрика web provider отдаёт mock; OI принудительно уходит в STUB |
| Нужен stub для демо | `LIA_OI_SEARCH_MODE=stub` |

---

## Тесты

```bash
npm test
# включает:
# scripts/test-lia-oi-stage1.ts
# scripts/test-lia-oi-stage2a.ts  (mocked Serper, без реального API)
```

---

## Что не входит в 2A

- Применение SQL / Supabase persistence (2B)
- Matching Engine
- Synthesis Engine
- Автономный scheduler
- Другие внешние источники кроме Serper (через существующий web_api)
- Production deploy без отдельного подтверждения
