# Growth Engine

Этап 60 · Версия `0.60.0-beta`  
UI: `/admin/growth` · `/admin/growth-kpi` · Лия: «Как растёт ЦКР?»

Связано: [public-launch-operations.md](./public-launch-operations.md) · [public-launch-execution.md](./public-launch-execution.md) · [open-beta-growth.md](./open-beta-growth.md)

---

## Цель

Создать управляемый механизм роста ЦКР после запуска Public Beta:

- рост аудитории;
- привлечение проектов;
- развитие экспертной сети;
- партнёрства;
- измерение качества роста.

**Без новых крупных бизнес-модулей и без новых ролей/каталогов.**

Используются: `public_launch`, `analytics_events`, `beta_invites`, `profiles`, `projects`, `experts`, `investments`, `opportunities`, `organizations`, `crm`, `lia`, `feedback`.

---

## Стратегия роста

1. Каналы привлечения (LaunchChannels / GrowthChannels).
2. Активация и retention (из Open Beta Growth).
3. Pipeline проектов через CRM.
4. Pipeline экспертов (invite → профиль → верификация → запросы).
5. Партнёры через `organizations` + канал `partner`.
6. Операционные GrowthTasks на дашборде.

---

## Каналы (GrowthChannels)

| Источник | Значение |
|---|---|
| Рекомендации | `referral` |
| Партнёры | `partner` |
| Мероприятия | `events` |
| Соцсети | `social` |
| Контент | `content` |
| Прямые приглашения | `email` |

Воронка:

**Источник → Регистрации → Активация → Первое действие → Результат**

---

## Процессы

### ProjectGrowthPipeline (CRM)

Найден проект → Контакт → Регистрация → Создание карточки → Публикация → Получение взаимодействий

Маппинг CRM-лидов: `new` / `contacted` / `qualified` / `project_created` / `deal`.

### ExpertGrowthPipeline

Поиск эксперта → Приглашение → Регистрация → Профиль → Верификация → Получение запросов

### PartnerGrowthTracking

Партнёр (`organizations`) → Приведённые пользователи (канал partner) → Проекты → Результаты (сделки)

---

## KPI

### User KPI

- регистрации;
- активация;
- retention (D7 / D30).

### Marketplace KPI

- проекты;
- эксперты;
- инвестиции;
- возможности.

### Ecosystem KPI

- связи;
- заявки;
- сделки.

### Partnership KPI

- партнёры;
- привлечённые пользователи.

Страница: `/admin/growth-kpi`.

---

## GrowthTasks

Типы: найти партнёра · пригласить экспертов · привлечь проекты · подготовить мероприятие · создать контент.

Статусы: `new` → `in_progress` → `completed`.

Таблица: `growth_tasks` (миграция `20260325550000_growth_engine.sql`).

---

## Лия

Сценарий: **«Как растёт ЦКР?»** → `GrowthReport`

Структура отчёта (только анализ):

- `summary`
- `user_growth`
- `project_growth`
- `expert_growth`
- `partner_growth`
- `channels`
- `recommendations`

---

## Порядок работы

1. Открыть `/admin/growth` — пользователи, каналы, pipelines.
2. Закрывать GrowthTasks.
3. Вести ProjectGrowthPipeline в CRM.
4. Сверять KPI на `/admin/growth-kpi`.
5. Еженедельно запрашивать у Лии «Как растёт ЦКР?».
