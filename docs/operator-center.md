# Операционный центр ЦКР

Этап 22: рабочее пространство команды ЦКР для разбора очереди, задач и контроля SLA.

Маршруты: `/operator`, `/operator/tasks`.

---

## 1. Работа команды

Операционный центр — внутренний контур. Он не заменяет кабинет участника и публичную платформу.

Команда видит:

- новые лиды CRM;
- новые / модерируемые проекты;
- заявки без ответа (`applications.status = new`);
- сделки в ожидании (`draft` / `negotiation` / `agreement`);
- документы и верификации на проверке;
- открытые операционные задачи.

Компоненты dashboard:

| Компонент | Назначение |
|---|---|
| `OperatorStats` | Сводка показателей |
| `OperatorQueue` | Единая очередь |
| `OperatorActivity` | Лента последних изменений |
| `OperatorInsights` | Рекомендации Лии-оператора |

---

## 2. Роли — `operator_roles`

| Роль | Назначение |
|---|---|
| manager | Координация лидов и задач |
| analyst | Разбор очереди и SLA |
| moderator | Проверка проектов и документов |
| admin | Полный доступ операционного центра |

Доступ в `/operator`:

- platform `user_roles.role = admin`, **или**
- активная запись в `operator_roles`.

Назначение ролей — через admin action `assignOperatorRoleAction` (только platform admin).

Helper RLS: `public.is_operator(uid)`.

---

## 3. Задачи — `tasks`

| Поле | Описание |
|---|---|
| title / description | Суть работы |
| assigned_to | Исполнитель |
| related_type / related_id | Связь с сущностью |
| priority | low · medium · high · urgent |
| status | new · in_progress · waiting · completed · cancelled |
| deadline | Срок |

Связи (`related_type`):

- lead
- project
- deal
- document
- verification

UI: `/operator/tasks` — создание, смена статуса, список.

Открытые статусы для очереди: `new`, `in_progress`, `waiting`.

---

## 4. SLA — `sla_rules`

Базовая таблица правил:

| entity_type | time_limit_hours | Пример |
|---|---|---|
| lead | 24 | Новый лид |
| application | 48 | Заявка без ответа |
| verification | 72 | Проверка / верификация |

Поля: `entity_type`, `time_limit_hours`, `active`, `label`.

Очередь помечает элементы бейджем **SLA**, если превышен лимит.  
`OperatorInsights` использует правила в рекомендациях.

Это основа: полный движок эскалаций — следующие итерации.

---

## 5. OperatorInsights (Лия)

Показывает:

- просроченные задачи;
- зависшие проекты (draft/moderation без движения > 72 ч);
- рекомендации по лидам, заявкам и верификациям.

Лия только рекомендует. Автоназначение и автозакрытие не выполняются.

Код: `src/lib/operator/insights.ts`, UI — `OperatorInsights`.

---

## 6. Миграция и код

| Артефакт | Путь |
|---|---|
| Миграция | `supabase/migrations/20260325310000_operator_center.sql` |
| Конфиг | `src/config/operator.ts` |
| Auth | `src/lib/auth/require-operator.ts` |
| Queries | `src/lib/operator/queries.ts` |
| Actions | `src/features/operator/actions.ts` |
| UI | `src/components/operator/*`, `src/app/(operator)/*` |

---

## 7. Принципы ЦКР

- Спокойный деловой интерфейс оператора.
- Публичная карточка ≠ кабинет ≠ CRM ≠ операционный центр.
- Роли сотрудников отделены от ролей участников рынка.
- Подтверждение админа остаётся обязательным для разрушающих действий в CRM/платформе.
