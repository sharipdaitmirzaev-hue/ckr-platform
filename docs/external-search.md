# Внешний поиск Лии

Этап 12: подключение реального внешнего поиска через абстракцию провайдера.

Лия объединяет:

**внутренние данные ЦКР** + **внешние результаты** → `SolutionReport`

---

## Архитектура

```text
SearchProvider
├─ InternalSearchProvider  (каталоги ЦКР)
└─ WebSearchProvider       (внешний поиск)
     ├─ mock               — локальная разработка
     ├─ web_api            — Serper / Brave / Tavily / generic
     └─ custom             — свой HTTP endpoint
```

Система **не привязана** к одному поисковому сервису. Смена провайдера — через переменные окружения, без изменения сценариев Лии.

Ключевые файлы:

| Путь | Назначение |
|---|---|
| `src/lib/lia/search/types.ts` | Контракты SearchProvider |
| `src/lib/lia/search/providers/web-api.ts` | Адаптер Web Search API |
| `src/lib/lia/search/providers/custom.ts` | Custom HTTP provider |
| `src/lib/lia/search/providers/mock-web.ts` | Mock fallback |
| `src/lib/lia/search/query-builder.ts` | Запросы по недостающим ресурсам |
| `src/lib/lia/search/normalize.ts` | Нормализация ExternalSearchResult |
| `src/lib/lia/search/web-provider.ts` | Фабрика провайдера |
| `src/app/api/lia/search/external/route.ts` | API внешнего поиска |
| `src/components/lia/external-search-results.tsx` | UI блок |
| `src/components/lia/source-badge.tsx` | Источник |
| `src/components/lia/trust-indicator.tsx` | Trust score |

---

## Результат поиска

Каждый внешний результат:

```ts
{
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  published_at: string;
  trust_score: number; // 0–1, эвристика
  trusted: false;      // всегда false
  query?: string;      // какой запрос дал hit
}
```

`trusted` **всегда** `false`. `trust_score` — лишь эвристика ранжирования провайдера, не верификация ЦКР.

---

## Провайдеры

### `mock` (по умолчанию)

Детерминированные результаты без сети. Используется, если ключ не задан или провайдер = `mock`.

### `web_api`

```env
LIA_WEB_SEARCH_PROVIDER=web_api
LIA_WEB_SEARCH_ENGINE=serper   # serper | brave | tavily | generic
LIA_WEB_SEARCH_API_KEY=...
LIA_WEB_SEARCH_BASE_URL=       # опционально / обязательно для generic
```

| Engine | Endpoint (по умолчанию) |
|---|---|
| `serper` | `POST https://google.serper.dev/search` |
| `brave` | `GET https://api.search.brave.com/res/v1/web/search` |
| `tavily` | `POST https://api.tavily.com/search` |
| `generic` | `POST {LIA_WEB_SEARCH_BASE_URL}` |

### `custom`

```env
LIA_WEB_SEARCH_PROVIDER=custom
LIA_WEB_SEARCH_BASE_URL=https://your-search.example/api
LIA_WEB_SEARCH_API_KEY=optional
LIA_WEB_SEARCH_METHOD=POST
```

Ожидаемый JSON:

```json
{
  "results": [
    {
      "title": "...",
      "url": "https://...",
      "description": "...",
      "source": "optional",
      "published_at": "2026-01-01"
    }
  ]
}
```

---

## Интеграция с анализом проекта

При «Анализ Лией» / «Найти решения»:

1. Определить недостающие ресурсы (`extractMissingResources`).
2. Сформировать поисковые запросы (`buildExternalSearchQueries`).

Пример для проекта «Производство воды»:

- линии розлива воды цена  
- производители оборудования для розлива воды  
- поставщики ПЭТ бутылки  
- требования к производству питьевой воды  

3. Получить результаты через `WebSearchProvider` (несколько запросов).
4. Объединить с внутренним поиском ЦКР.
5. Сформировать `SolutionReport` (поля `searchQueries`, `externalProvider`, `external`).

Приватные документы пользователя **не** передаются во внешний поиск — только публичные поля карточки проекта и сформированные текстовые запросы.

---

## API

### `GET /api/lia/search/external`

Информация о текущем провайдере и форме результата.

### `POST /api/lia/search/external`

```json
{ "query": "линии розлива воды цена", "limit": 5 }
```

Требует авторизации. Возвращает нормализованные результаты с `trusted: false`.

### `POST /api/lia/analyze`

Анализ проекта использует query-builder и внешний провайдер автоматически (`mode: find_solutions`).

---

## UI

В отчёте Лии разделены блоки:

- **Найдено в ЦКР** — MatchCard  
- **Найдено во внешних источниках** — `ExternalSearchResults` + `SourceBadge` + `TrustIndicator`

---

## Owner Opportunity Intelligence (Stage 2A)

Закрытый кабинет владельца использует тот же `WebSearchProvider` / Serper
через тонкий адаптер OI (`src/lib/lia/oi/internet/live.ts`).

Подробности: режимы STUB/LIVE, лимиты, SSRF, как включить ключ — в
[`docs/lia-oi.md`](./lia-oi.md).

---

## Безопасность и ограничения

| Правило | Реализация |
|---|---|
| Внешние данные неподтверждены | `trusted: false`, UI «Не подтверждено» |
| Показывать источник | `source` + `SourceBadge` |
| Не создавать заявки автоматически | Поиск только читает |
| Не изменять данные пользователя | Запись только в `lia_analyses` (отчёт) |
| Не слать приватные документы | В API уходит только query-текст |
| Сбой внешнего API | Не ломает анализ — пустой внешний блок |
| Без ключа | Fallback на mock |

Ограничения:

- качество зависит от выбранного движка и ключа;
- `trust_score` не равен юридической/финансовой проверке;
- rate limit тот же, что у чата Лии;
- результаты — ориентир для пользователя, не действие платформы.
