# Сделки и сопровождение проектов ЦКР

Этап 13: механизм перехода от найденного решения к реальной реализации.

**Концепция:** ЦКР не только соединяет участников — ЦКР сопровождает путь проекта.

---

## Архитектура

```text
Публичная карточка /project/[id]
        ≠
Кабинет проекта /dashboard/projects/[id]/workspace
   ├─ участники
   ├─ сделки (deals + deal_participants)
   ├─ задачи / этапы (project_milestones)
   ├─ документы (documents related_type=project)
   └─ история (project_activity)
        ↑
Лия: сценарий «Помоги реализовать проект»
```

Миграция: `supabase/migrations/20260325230000_deals_milestones_workspace.sql`.

---

## 1. Сделки (`deals`)

| Поле | Описание |
|---|---|
| `project_id` | Проект |
| `initiator_id` | Кто создал |
| `partner_id` | Партнёр (опционально) |
| `deal_type` | Тип |
| `amount` / `currency` | Сумма |
| `status` | Статус |
| `description` | Описание |
| `commission_type` | `fixed` · `percent` (Этап 16) |
| `commission_amount` | Сумма или процент комиссии |
| `commission_status` | `pending` · `paid` · `cancelled` |

**Типы:** `investment` · `partnership` · `service` · `purchase` · `lease` · `other`

**Статусы:** `draft` → `negotiation` → `agreement` → `active` → `completed` / `cancelled`

Создание сделки доступно владельцу проекта. При создании инициатор добавляется в `deal_participants` с ролью `owner`.

---

## 2. Участники сделки (`deal_participants`)

| Поле | Описание |
|---|---|
| `deal_id` | Сделка |
| `user_id` | Пользователь |
| `role` | Роль |

**Роли:** `owner` · `investor` · `partner` · `expert`

Уникальность: `(deal_id, user_id)`.

---

## 3. Этапы реализации (`project_milestones`)

| Поле | Описание |
|---|---|
| `project_id` | Проект |
| `title` / `description` | Содержание |
| `status` | Статус |
| `deadline` | Срок |
| `sort_order` | Порядок |

**Статусы:** `planned` · `in_progress` · `completed` · `blocked`

Типовой план (кнопка в кабинете):

1. Найти землю  
2. Получить финансирование  
3. Купить оборудование  
4. Запустить производство  

---

## 4. Кабинет проекта

Маршрут: `/dashboard/projects/[id]/workspace`

Разделы:

- **Участники** — владелец + участники сделок  
- **Сделки** — список, создание, смена статуса  
- **Задачи** — этапы реализации  
- **Документы** — связанные с проектом  
- **История** — лента `project_activity`  

Публичная карточка `/project/[id]` остаётся отдельно и не показывает внутренние сделки/этапы.

---

## 5. История (`project_activity`)

Типы событий:

- `status_change`
- `participant_added`
- `document_uploaded`
- `milestone_created` / `milestone_updated` / `milestone_completed`
- `deal_created` / `deal_updated`
- `note`

Пишется при действиях в кабинете (сделки, этапы, участники).

---

## 6. Лия в сопровождении

Сценарий: **«Помоги реализовать проект»** (`realize_project`).

Лия анализирует:

- статус и стадию проекта;
- незавершённые этапы;
- отсутствующие ресурсы.

Предлагает:

- следующий шаг;
- эксперта из каталога;
- возможного партнёра / инвестицию / возможность.

Запуск:

- кнопка в кабинете → `/lia?project=<id>`  
- или сценарий в чате + `projectId`

**Лия только рекомендует** — не создаёт сделки и не меняет этапы.

---

## Безопасность (RLS)

| Сущность | Кто видит / меняет |
|---|---|
| `deals` | Участники сделки / workspace; create — владелец проекта |
| `deal_participants` | Участники сделки; manage — владелец / инициатор |
| `project_milestones` | Члены workspace; mutate — владелец |
| `project_activity` | Члены workspace; insert — члены workspace |

Helpers:

- `is_project_owner(project_id)`
- `is_project_workspace_member(project_id)` — владелец, admin, initiator/partner сделки или `deal_participants`
- `is_deal_participant(deal_id)`

Внутренняя информация кабинета **не** попадает в публичную карточку.

---

## Ключевые файлы

| Путь | Назначение |
|---|---|
| `src/config/deals.ts` | Типы, статусы, типовые этапы |
| `src/lib/deals/queries.ts` | Чтение сделок / этапов / истории |
| `src/features/deals/actions.ts` | Мутации |
| `src/app/(dashboard)/dashboard/projects/[id]/workspace/page.tsx` | Кабинет |
| `src/lib/lia/realize.ts` | Сценарий сопровождения Лии |
| `src/components/deals/*` | UI карточек и таймлайна |
