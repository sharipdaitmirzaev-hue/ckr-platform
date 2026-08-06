# Аналитика ЦКР

Этап 17: система показателей для управления платформой и принятия решений.

Миграция: `supabase/migrations/20260325270000_analytics_events.sql`.

---

## Принципы доступа

| Роль | Что видит |
|---|---|
| Admin | Общая аналитика `/admin/analytics` |
| Владелец / участник проекта | Только аналитика своего проекта в workspace |
| Аноним | Может писать `project_viewed` без `user_id` |

---

## 1. События (`analytics_events`)

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid? | Кто совершил (nullable для анонимов) |
| `event_type` | text | Тип события |
| `entity_type` | text? | Тип сущности |
| `entity_id` | uuid? | ID сущности |
| `metadata` | jsonb | Доп. данные |
| `created_at` | timestamptz | Время |

### Типы событий

- `user_registered`
- `project_created`
- `project_viewed`
- `opportunity_created`
- `investment_created`
- `application_sent`
- `deal_created`
- `deal_completed`
- `document_verified`

Воронка первых пользователей (этап 49):

- `public_page_view`
- `registration_started`
- `registration_completed`
- `role_selected`
- `lia_started`
- `first_object_created`

Запись: `trackAnalyticsEvent()` в `src/lib/analytics/track.ts` (не ломает основной сценарий при ошибке).  
Клиентские точки: `PublicPageViewTracker`, `RegistrationStartedTracker` → `trackLaunchFunnelEventAction`.

### RLS

- **insert:** `user_id is null` или `user_id = auth.uid()`
- **select:** admin · свои события · события проектов, где пользователь владелец

---

## 2. Админская аналитика `/admin/analytics`

Период: `7d` · `30d` · `90d`.

### Пользователи

- всего;
- новые за период;
- активные (уникальные `user_id` в событиях за период).

### Проекты

- всего;
- опубликованные;
- по категориям (бар-чарт).

### Инвестиции

- количество опубликованных;
- общий объём (среднее по диапазону min…max).

### Сделки

- активные (`negotiation` / `agreement` / `active`);
- завершённые;
- сумма завершённых.

### Эксперты

- количество опубликованных;
- по специализациям.

---

## 3. Аналитика проекта (`ProjectAnalytics`)

В кабинете `/dashboard/projects/[id]/workspace`:

- просмотры (`project_viewed`);
- заявки на проект;
- инвестиционный интерес (заявки + сделки `investment`);
- активность (`project_activity`).

Компонент: `src/components/analytics/project-analytics.tsx`.

---

## 4. Лия и аналитика

`getLiaMarketSnapshot()` / `formatLiaMarketSnapshot()` — факты рынка:

- количество проектов;
- категории и регионы;
- спрос (заявки);
- предложения (возможности, инвестиции).

Снимок кладётся в `metadata.marketSnapshot` ответа Лии.  
**Пока без автоматических выводов.**

---

## 5. UI-компоненты

| Компонент | Назначение |
|---|---|
| `StatsCard` | Крупная карточка показателя |
| `MetricCard` | Компактная метрика |
| `AnalyticsChart` | Горизонтальные бары без внешних библиотек |
| `ProjectAnalytics` | Блок в workspace |

Стиль: тёмно-синий фон платформы, золотой акцент, Manrope/Onest.

---

## 6. Использование данных

```text
События → агрегации админки → решения оператора
События проекта → ProjectAnalytics → владелец
Снимок рынка → metadata Лии → будущие рекомендации
```

Ключ не в «платных просмотрах», а в понимании спроса, предложения и успешных сделок.
