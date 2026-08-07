# Public Launch Operations

Этап 59 · Версия `0.59.0-beta`  
UI: `/admin/public-launch-operations` · Лия: «Как проходит запуск ЦКР сейчас?»

Связано: [public-launch-execution.md](./public-launch-execution.md) · [public-launch-decision.md](./public-launch-decision.md) · [public-beta-launch-plan.md](./public-beta-launch-plan.md)

---

## Цель

Активировать Public Launch и вести операционное управление платформой после открытия доступа.

После этого этапа ЦКР считается **работающей публичной beta-платформой**. Дальше фокус: рост, партнёрства, проекты, сделки, монетизация.

**Без новых крупных бизнес-модулей.**

---

## Активация

Условие: последнее `public_launch_decisions.decision = public_launch`.

| Решение | Действие |
|---|---|
| `public_launch` | `planned → active`, дата старта, ответственный, комментарий, событие `public_launch_activated` |
| `continue_beta` | Не активировать |
| `improve_product` | Не активировать |

Фиксация: таблица `public_launch_activations` + analytics `public_launch_activated`.

---

## Порядок работы после запуска

1. Проверить `/admin/public-launch-operations` (статус, день, цели).
2. Смотреть **LaunchDailyMetrics** и **LaunchHealthMonitor**.
3. Закрывать **LaunchOperationsTasks**.
4. Вести цепочку feedback `public_launch` → issue → improvement.
5. Еженедельно сверять KPI на `/admin/public-launch-kpi`.

---

## Контрольные метрики

### Ежедневно (LaunchDailyMetrics)

- регистрации за день;
- активные пользователи;
- новые проекты / эксперты;
- Лия;
- заявки;
- сделки.

### Health (LaunchHealthMonitor)

| Область | Что смотрим |
|---|---|
| Product | ошибки, UX / Critical |
| Users | активация, retention |
| Ecosystem | активность, взаимодействия |
| Business | результаты / сделки |

---

## Ежедневные действия

- Critical queue = 0 (или в работе с владельцем);
- ответы пользователям (задача `reply_user`);
- проверка новых проектов и профилей экспертов;
- партнёрские касания при необходимости;
- разбор feedback категории `public_launch`.

---

## Операционные задачи

Типы: проверить проект · проверить профиль эксперта · ответить пользователю · обработать проблему · связаться с партнёром.

Статусы: `new` → `in_progress` → `completed`.

Таблица: `launch_operations_tasks` (seed при активации).

---

## Обработка проблем

```text
User feedback (category / source: public_launch)
        ↓
Launch issue (pilot_issues.source_type = public_launch)
        ↓
Product improvement (source_type = public_launch)
```

Источник `public_launch` добавлен в `product_improvement_source`.

---

## Лия

Сценарий `live_launch` → `LiveLaunchReport` (только анализ):

summary · users · activity · ecosystem · issues · recommendations
