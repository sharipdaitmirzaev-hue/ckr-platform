# Closed Pilot ЦКР

Этап 29: инструменты наблюдения за закрытым пилотом.  
Этап 36: операционное управление — [pilot-operations.md](./pilot-operations.md).  
Версия: `0.36.0-beta` · Связано: [launch-readiness.md](./launch-readiness.md) · [tinda-pilot.md](./tinda-pilot.md) · [beta-launch.md](./beta-launch.md)

---

## Цели

1. Проверить end-to-end сценарии предпринимателя, инвестора и оператора на реальных (приглашённых) участниках.  
2. Собрать количественные метрики воронки: регистрация → профиль → проект → заявка → сделка → Лия.  
3. Зафиксировать качественный feedback и проблемы (`pilot_issues`) до открытого beta.  
4. Не расширять продукт новыми бизнес-модулями — только наблюдение и сопровождение.

---

## Участники

| Роль | Кто | Ожидаемый объём |
|---|---|---|
| Предприниматель | владельцы проектов | 5–10 |
| Инвестор | с интересом / заявками | 3–5 |
| Оператор ЦКР | CRM + модерация | 1–2 |
| Admin | invites, users, analytics | 1 |

Доступ: `NEXT_PUBLIC_BETA_REQUIRE_INVITE=true`, приглашения через `/admin/invites`.  
Кабинет наблюдения: `/admin/pilot` (admin или operator).

---

## Сценарии

### Предприниматель

```text
Регистрация → Онбординг → Лия → Проект → Публикация → Заявки → Сделка → Workspace
```

### Инвестор

```text
Регистрация → Профиль → Каталог → «Интересно» → Заявка → Участие в сделке
```

### Оператор

```text
CRM / лиды → Модерация → Задачи → Pilot Dashboard (метрики и issues)
```

Подробный статус готовности сценариев: [launch-readiness.md](./launch-readiness.md).

---

## Метрики

События пишутся в `analytics_events` (канал `closed_pilot` для новых pilot-метрик).

| Событие | Когда |
|---|---|
| `registration_completed` | успешная регистрация |
| `profile_completed` | завершён онбординг |
| `project_created` | создан проект |
| `project_published` | статус проекта → published |
| `application_sent` | отправлена заявка |
| `deal_created` | создана сделка |
| `lia_used` | успешный запрос к Лии |

Dashboard: `/admin/pilot` — счётчики, участники, активные проекты, заявки, сделки, сессии Лии, лента событий.

---

## Feedback

Таблица `feedback` связана с:

- **пользователем** — `user_id`  
- **страницей** — `page`  
- **объектом** — `related_type` + `related_id` (из URL: project / opportunity / investment / …)

UI: кнопка «Обратная связь» на публичных и кабинетных страницах (кроме `/admin`).

Категории пилота (этап 36): `bug` · `ux` · `idea` · `business_value` · `lia_quality` (+ `question` / `review`).  
Приоритет: `low` · `medium` · `high` · `critical`.

---

## Pilot issues

Таблица `pilot_issues`:

| Поле | Значения |
|---|---|
| title / description | текст |
| severity | `critical` · `high` · `medium` · `low` |
| status | `open` · `in_progress` · `resolved` · `closed` |
| created_at | timestamptz |

Создание и смена статуса — в `/admin/pilot`.

---

## Критерии успеха

Пилот считается успешным, если:

1. ≥ 5 участников прошли `registration_completed` + `profile_completed`.  
2. ≥ 3 проекта дошли до `project_published`.  
3. Есть цепочка `application_sent` → `deal_created` минимум на 1 проекте.  
4. Лия использована (`lia_used`) не менее чем 50% активных предпринимателей.  
5. Нет открытых `pilot_issues` со severity `critical` к концу пилота.  
6. Собран feedback с привязкой к страницам/объектам (не только общие комментарии).  
7. Операторы ведут CRM/модерацию без полного admin-доступа.

После успеха — переход к open beta (см. план в launch-readiness).

---

## Миграция

`supabase/migrations/20260325370000_closed_pilot_tools.sql`

- колонки `feedback.related_type` / `related_id`  
- таблица `pilot_issues` + RLS для staff  

Применить вместе с миграциями этапов 20–28 перед стартом пилота.
