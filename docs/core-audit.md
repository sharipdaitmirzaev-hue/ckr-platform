# Аудит ядра ЦКР

Этап 25: проверка и стабилизация существующей платформы перед 1.0.

Дата аудита: 2026-03-25. Новые крупные бизнес-функции не добавлялись.

---

## 1. Структура проекта

| Слой | Состояние |
|---|---|
| `src/app` | Маршруты public / auth / dashboard / admin / operator / partner / api |
| `src/components` | UI + доменные карточки |
| `src/features` | Server actions и feature-формы |
| `src/lib` | Queries, mappers, auth gates |
| `src/config` | Константы, лейблы, сценарии |
| `supabase/migrations` | Последовательные миграции 0–25 |

**Проблема:** локальный `main` мог отставать от feature-веток; рабочая линия — накопленные этапы 0–24.

**Исправление:** стабилизация ведётся поверх Этапа 24; документация и версии синхронизированы.

---

## 2. Найденные проблемы и исправления

### 2.1. Жизненный цикл проекта

| Проблема | Исправление |
|---|---|
| В enum только `draft/moderation/published/archived` | Добавлены `active`, `completed` (миграция `20260325340000_project_lifecycle.sql`) |
| Владелец мог выбрать любой статус в форме | Создание всегда `draft`; переходы — `advanceProjectStatusAction` |
| Нет отображения цепочки этапов | Компонент `ProjectLifecycle` в workspace и edit |
| Каталог/RLS только `published` | Публично видны `published/active/completed` |
| Сделки не влияли на статус проекта | `syncProjectLifecycleFromDeal`: published → active |

Поле `stage` (idea/startup/operating/expansion) остаётся **стадией бизнеса**, не жизненным циклом.

### 2.2. Роли

| Проблема | Исправление |
|---|---|
| Роли разнесены по модулям без единой карты | Создан `docs/roles-and-permissions.md` |

Код ролей не ломался: user / org / operator / admin уже разделены.

### 2.3. Dashboard

| Проблема | Исправление |
|---|---|
| `/dashboard` — только ссылки и Lia | Единый обзор: проекты, заявки, инвестиции, сделки, уведомления, этапы, Lia |

### 2.4. События и уведомления

| Событие | Было | Стало |
|---|---|---|
| Проект создан | activity + analytics | без изменений |
| Заявка отправлена | notify + analytics | без изменений |
| Заявка принята | notify | + `application_accepted` analytics |
| Документ загружен | только insert | activity + notify + analytics |
| Сделка создана | activity + analytics | + notify участникам |
| Этап завершён | activity | + analytics |

### 2.5. UX

| Проблема | Исправление |
|---|---|
| Нет подтверждения архива | `ConfirmSubmitButton` |
| Разрозненные empty states | `EmptyState` на dashboard / projects |
| Loading/Error | уже есть `(dashboard)/loading`, `error.tsx` |

### 2.6. Дублирование / типы

| Проблема | Исправление |
|---|---|
| `PublishStatus` использовался и для проектов | Введён `ProjectStatus` (6 этапов); `PublishStatus` — для opportunities/offers |
| Нет helper переходов | `src/lib/projects/lifecycle.ts` |

---

## 3. API и Supabase

- REST/App Router API: `/api/lia`, `/api/lia/analyze`, `/api/lia/search/external`, `/api/demo/seed` — без изменений контракта.
- RPC: `create_notification`, `log_activity_feed`, `is_admin`, `is_operator` — используются стабильно.
- Новых Edge Functions не добавлялось.

---

## 4. Рекомендации (после 1.0)

1. Вынести переходы жизненного цикла в CHECK/trigger на стороне БД.
2. Добавить dedicated confirm-modal вместо `window.confirm` при необходимости a11y.
3. Единый event-bus слой (вместо разрозненных track + rpc + activity inserts).
4. Mobile API — отдельный этап после стабилизации ядра.
5. Покрыть lifecycle интеграционными тестами на статусы.

---

## 5. Миграции этапа

| Файл | Назначение |
|---|---|
| `supabase/migrations/20260325340000_project_lifecycle.sql` | enum `active` / `completed` |
| `supabase/migrations/20260325341000_project_lifecycle_rls.sql` | RLS каталога для published/active/completed |
