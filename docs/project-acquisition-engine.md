# Project Acquisition Engine

Этап 61 · Версия `0.61.0-beta`  
UI: `/admin/project-acquisition` · Лия: «Аудит моего бизнеса» · «Как развивается поток проектов ЦКР?»

Связано: [growth-engine.md](./growth-engine.md) · [tinda-project-acquisition-case.md](./tinda-project-acquisition-case.md) · [tinda-case-study.md](./tinda-case-study.md)

---

## Цель

Создать постоянный поток качественных бизнес-проектов для экосистемы ЦКР:

- поиск проектов;
- работа с предпринимателями;
- конвертация интереса в проект;
- качество карточек;
- развитие через ЦКР.

**Без нового каталога проектов и без новых крупных бизнес-модулей.**

Используются: `projects`, `opportunities`, `crm` / `leads`, `profiles`, `organizations`, `lia`, `analytics_events`, `growth_engine`, `feedback`.

---

## Воронка (ProjectAcquisitionPipeline)

| Статус | Смысл | CRM / projects |
|---|---|---|
| `lead_found` | Найден проект | CRM `new` |
| `contacted` | Контакт | CRM `contacted` |
| `interested` | Заинтересован | CRM `qualified` |
| `draft_created` | Создан проект | CRM `project_created` / `projects.draft` |
| `moderation` | На модерации | `projects.moderation` |
| `published` | Опубликован | `projects.published` |
| `active` | Получает взаимодействия | `projects.active` + applications |

Метрики этапа: количество, конверсия от предыдущего, среднее время (дни).

---

## Источники (ProjectSources)

| Источник | Значение |
|---|---|
| Предприниматель самостоятельно | `entrepreneur` |
| ТИНДА / кейсы | `tinda` |
| Партнёры | `partners` |
| Мероприятия | `events` |
| CRM | `crm` |
| Лия | `lia` |
| Рекомендации | `referral` |

Воронка источника: **Источник → Лид → Проект → Результат**.

---

## Лия как канал привлечения

Публичный сценарий **«Аудит моего бизнеса»** (`business_audit`):

1. Пользователь описывает бизнес (вопросы Лии).
2. Формируется `BusinessAuditReport`.
3. Лия предлагает создать проект по шаблону `business_development`.
4. **Создание только после подтверждения** (кнопка «Создать проект» / форма).

Анализ потока: **«Как развивается поток проектов ЦКР?»** → `ProjectAcquisitionReport`
(`summary`, `sources`, `conversion`, `quality`, `problems`, `recommendations`).

---

## Шаблон развития бизнеса

Путь (existing template + отчёты):

**Аудит → Стратегия → Проект развития → Ресурсы → Эксперты / партнёры / инвестиции**

- `BusinessAuditReport`
- `StrategyReport`
- template `business_development`

---

## Качество (ProjectQualityScore)

Показатели (рекомендация, без автоблокировки публикации):

- заполненность;
- наличие цели;
- описание проблемы;
- необходимые ресурсы;
- готовность владельца;
- стадия.

---

## Аналитика

События:

- `project_lead_created`
- `project_contacted`
- `project_interest_confirmed`
- `project_draft_created`
- `project_published_from_acquisition`

Пишутся из CRM (лиды / конвертация) и жизненного цикла `projects`.

---

## Порядок работы

1. Открыть `/admin/project-acquisition`.
2. Вести лиды в CRM по pipeline.
3. Поднимать ProjectQualityScore перед публикацией.
4. Масштабировать публичный аудит Лии.
5. Еженедельно: сценарий «Как развивается поток проектов ЦКР?».
