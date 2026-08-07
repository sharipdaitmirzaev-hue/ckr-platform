# Project Execution — управление реализацией проектов ЦКР

Этап 33 · Версия `0.33.0-beta`

Цель: сопровождать проект **от стратегии до фактического результата** на существующих контурах (`projects`, workspace, milestones, tasks, deals, analytics, Лия). Новые типы участников и крупные бизнес-модули не добавлялись.

Связано: [ckr-methodology.md](./ckr-methodology.md) · [deals-and-workspace.md](./deals-and-workspace.md) · [tinda-pilot.md](./tinda-pilot.md) · [lia-flows.md](./lia-flows.md)

---

## 1. Дорожные карты

### `project_roadmaps`

| Поле | Описание |
|---|---|
| id | uuid |
| project_id | проект |
| title / description | название и описание |
| status | `draft` · `active` · `completed` · `archived` |
| created_at / updated_at | служебные |

### `roadmap_items`

| Поле | Описание |
|---|---|
| id | uuid |
| roadmap_id | дорожная карта |
| title / description | этап |
| order_number | порядок |
| responsible_user_id | ответственный |
| deadline | срок |
| status | `planned` · `in_progress` · `blocked` · `completed` · `cancelled` |
| milestone_id | связь с `project_milestones` (опционально) |

### Связь

```text
Roadmap → Items → Tasks
              ↘ project_milestones
```

Задачи хранятся в существующей таблице `tasks` (`roadmap_item_id`, `related_type = roadmap_item`).

Миграция: `supabase/migrations/20260325380000_project_execution.sql`

---

## 2. KPI проекта

### `project_metrics`

| Поле | Описание |
|---|---|
| name | название показателя |
| description | пояснение |
| target_value / current_value | цель и факт |
| unit | ед. измерения |
| period | горизонт (`month` / `quarter` / `year` / …) |

Примеры (пилот ТИНДА): количество клиентов, контактов, партнёров, сделок.

---

## 3. Контроль прогресса

Компонент `ProjectProgress` в workspace проекта (`/dashboard/projects/[id]/workspace`):

- текущий этап roadmap;
- процент выполнения этапов;
- ближайшие задачи;
- просрочки (этапы и задачи);
- KPI с обновлением значений владельцем.

Код:

- UI: `src/components/execution/project-progress.tsx`
- queries: `src/lib/execution/queries.ts`
- actions: `src/features/execution/actions.ts`
- config: `src/config/execution.ts`

---

## 4. Роль Лии

Сценарий **«Проверь прогресс проекта»** (`check_progress`):

Анализирует текущий этап, roadmap, задачи, KPI и активность.

Результат — `ProgressReport`:

- `summary`
- `completed_items`
- `delayed_items`
- `risks`
- `recommendations`
- `next_steps`

**Важно:** Лия не изменяет данные сама — только анализирует и предлагает. Фиксация проверки пишется в `project_activity` / analytics как событие контроля.

---

## 5. Аналитика и уведомления

События `analytics_events`:

| event_type | Когда |
|---|---|
| `roadmap_created` | создана дорожная карта |
| `roadmap_item_completed` | этап roadmap завершён |
| `metric_updated` | обновлён KPI |
| `project_progress_checked` | проверка прогресса (workspace / Лия) |

Параллельно:

- `project_activity` (история workspace) → зеркало в `activity_feed` владельца;
- `create_notification` при создании roadmap и завершении этапа.

---

## 6. Применение на ТИНДА

Seed v2 добавляет:

**Roadmap**

1. Подготовка — задачи: ассортимент, поставщики, склад  
2. Продажи — поиск клиентов, переговоры, первые сделки  
3. Масштабирование — расширение клиентов, новые регионы, новые категории  

**KPI**

| Показатель | Цель | Текущее |
|---|---|---|
| Количество клиентов | 100 | 25 |
| Количество контактов | 50 | 6 |
| Количество партнёров | 20 | 2 |
| Количество сделок | 10 | 1 |

Данные: `src/lib/pilot/tinda-seed-data.ts` · apply: `src/lib/pilot/apply-tinda-seed.ts`

---

## 7. RLS

- Чтение roadmap / items / metrics: участники workspace (+ admin / operator)
- Запись: владелец проекта (+ admin)
- Tasks по `roadmap_item_id`: чтение участникам проекта, запись владельцу (операторский доступ сохранён)

---

## 8. Критерий этапа 33

- [x] Таблицы `project_roadmaps`, `roadmap_items`, `project_metrics`
- [x] Связь с `tasks` и `project_milestones`
- [x] `ProjectProgress` в workspace
- [x] Лия `check_progress` → `ProgressReport`
- [x] Seed ТИНДА с roadmap и KPI
- [x] Документ `docs/project-execution.md`
- [x] `npm run lint` / `npm run build`
