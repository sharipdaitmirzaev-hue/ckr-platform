# Лия — создание проектов и поиск решений

Единый модуль Этапа 11: **«Лия — ИИ-навигатор ЦКР: создание проектов и поиск решений»**.

Цепочка:

**Идея → Анализ → Проект → Поиск ресурсов → Комплексное решение → Реализация**

---

## Архитектура

```text
/lia  +  карточка проекта («Анализ Лией» / «Найти решения»)
        ↓
POST /api/lia              — диалоги и сценарии
POST /api/lia/analyze      — анализ проекта + SolutionReport
server actions             — createProjectFromLiaDraft / analyzeProjectWithLia
        ↓
runLiaEngine()             — чат-сценарии
buildSolutionReport()      — анализ проекта
        ↓
SearchProvider
  ├─ InternalSearchProvider  → projects / opportunities / investments / experts
  └─ WebSearchProvider       → mock | web_api | custom (см. external-search.md)
        ↓
lia_sessions / lia_messages / lia_analyses (Supabase RLS)
```

Ключевые файлы:

| Путь | Назначение |
|---|---|
| `src/app/(public)/lia/page.tsx` | Диалоги + история анализа |
| `src/app/api/lia/route.ts` | Чат API |
| `src/app/api/lia/analyze/route.ts` | Анализ проекта API |
| `src/lib/lia/engine.ts` | Сценарии чата |
| `src/lib/lia/analysis.ts` | SolutionDraft / SolutionReport |
| `src/lib/lia/search/` | Internal + Web провайдеры |
| `src/features/lia/actions.ts` | Создание проекта и анализ |
| `src/components/lia/*` | UI: preview, analysis, match, external |
| `supabase/migrations/20260325220000_lia_analyses.sql` | История анализов |

---

## Часть 1. Создание проекта

Сценарий «Помоги создать бизнес-проект»:

1. Лия задаёт вопросы (название, отрасль, регион, описание, ресурсы, сумма, стадия).
2. Собирает `ProjectDraft`:
   - `title`, `summary`, `description`, `category`, `region`
   - `investment_required`, `stage`
   - `existing_resources`, `required_resources`
3. Показывает preview (`ProjectDraftPreview` / `LiaProjectFlow`).
4. Кнопки: **Редактировать** / **Создать проект**.
5. После подтверждения — запись в `projects` со статусом `draft`.
6. Редирект: `/dashboard/projects/[id]/edit`.

**Лия не создаёт проекты без подтверждения пользователя.**

---

## Часть 2. Анализ проекта

Действия на карточке проекта / в редактировании:

- **Анализ Лией**
- **Найти решения**

Результат — `SolutionDraft`:

```ts
{
  project_id,
  summary,
  available_resources[],
  missing_resources[],   // инвестиции, земля, помещение, оборудование, специалисты, партнёры…
  recommendations[],
  risks[],
  next_steps[]
}
```

История сохраняется в `lia_analyses`.

---

## Часть 3. Внутренний поиск (ЦКР)

`InternalSearchProvider` (`CkrInternalSearchProvider`):

- `searchProjects()`
- `searchOpportunities()`
- `searchInvestments()`
- `searchExperts()`

Результат (`InternalMatch`): название, тип, ссылка, описание, соответствие (`matchScore` 0–1).

Источники: опубликованные записи `projects`, `opportunities`, `investment_offers`, `expert_profiles`.

---

## Часть 4. Внешний поиск

Контракт `SearchProvider` / `WebSearchProvider`.

Провайдеры: `mock` | `web_api` (serper/brave/tavily/generic) | `custom`.

Подробности, переменные окружения и безопасность: [external-search.md](./external-search.md).

Внешний результат (`ExternalSearchResult`):

- `id`, `title`, `description`, `url`, `source`, `published_at`, `trust_score`
- всегда `trusted: false`

**Внешним данным нельзя доверять автоматически.**

---

## Часть 5. Комплексное решение

`SolutionReport` объединяет:

1. Данные проекта.
2. Найденные объекты ЦКР.
3. Внешние результаты.
4. Рекомендации и следующие шаги.

UI: `SolutionPanel` + `MatchCard` + `ExternalResultCard` + блок рекомендаций.

---

## Часть 6. Интерфейс

- `/lia` — чат, сценарии, история анализа.
- Карточка проекта и `/dashboard/projects/[id]/edit` — «Анализ Лией», «Найти решения».

Компоненты:

- `LiaProjectFlow`
- `ProjectDraftPreview`
- `ProjectAnalysis`
- `SolutionPanel`
- `MatchCard`
- `ExternalResultCard`
- `AnalysisHistory`
- `ProjectLiaActions`

---

## Часть 7. Безопасность и ограничения

| Правило | Как обеспечено |
|---|---|
| Лия только рекомендует | Нет авто-заявок / авто-мутаций каталогов |
| Не создаёт проекты без подтверждения | `createProjectFromLiaDraftAction` только по кнопке |
| Не меняет данные без подтверждения | Анализ пишет только в `lia_analyses` |
| Внешние источники отдельно | Badge «Не проверено», `trusted: false` |
| Приватные документы не уходят во внешние модели | В provider/analyze передаётся только публичный текст карточки проекта |

---

## База данных

### `lia_analyses`

Миграция: `supabase/migrations/20260325220000_lia_analyses.sql`.

Поля: `user_id`, `project_id`, `summary`, JSON-массивы ресурсов/рекомендаций/рисков/шагов, `internal_matches`, `external_results`, полный `report`.

RLS: владелец видит свои анализы; admin — все; insert только своим `user_id`.

---

## API

### `POST /api/lia`

Диалоги и сценарии (как на Этапах 9–10).

### `POST /api/lia/analyze`

Тело:

```json
{ "projectId": "uuid", "mode": "analyze" | "find_solutions" }
```

Ответ: `SolutionDraft` + `SolutionReport`. Только для владельца проекта.
