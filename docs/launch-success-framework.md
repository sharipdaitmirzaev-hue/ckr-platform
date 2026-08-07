# Launch Success Framework — оценка успешности запуска ЦКР

Этап 42. Версия: `0.42.0-beta`  
UI: `/admin/launch` · Волны: [wave-launch.md](./wave-launch.md) · Чеклист: [public-launch-checklist.md](./public-launch-checklist.md)

Новые крупные бизнес-модули **не** входят в scope. Цель этапа — измерять эффективность запуска.

---

## Цели запуска

Таблица `launch_goals` привязана к `launch_waves`.

| Поле | Смысл |
|---|---|
| `wave_id` | Волна |
| `title` / `description` | Формулировка цели |
| `metric_type` | Тип метрики |
| `target_value` / `current_value` | План / факт |
| `status` | `active` · `achieved` · `failed` · `cancelled` |

### Типы метрик

| `metric_type` | Что считает |
|---|---|
| `users` | Участники волны |
| `activation` | Профиль / первое действие |
| `projects` | Созданные проекты |
| `applications` | Заявки |
| `deals` | Сделки |
| `lia_usage` | Использование Лии |
| `business_results` | Бизнес-результаты (в т.ч. ТИНДА CRM) |

### Пример: Closed Wave

- 20 участников  
- 10 заполненных профилей  
- 5 проектов  
- 3 заявки  
- 1 сделка  
- использование Лии  
- бизнес-цели ТИНДА: контакты клиентов, переговоры, партнёры, сделки  

---

## Метрики (LaunchMetrics)

Слой `/src/lib/launch/metrics.ts` показывает:

**Пользователи:** приглашено · зарегистрировано · активно  

**Активация:** профиль завершён · первое действие · Лия  

**Бизнес:** проекты · заявки · сделки · результаты  

Текущие значения целей синхронизируются при открытии `/admin/launch` (`syncLaunchGoalsForWave`).

---

## Критерии успеха

1. **Цель достигнута** — `current_value >= target_value` → статус `achieved` + событие `launch_goal_achieved`.  
2. **Волна завершена** — статус волны `completed` → активные недоборные цели → `failed`, событие `launch_wave_completed`.  
3. **Переход к следующей волне** — см. критерии в [wave-launch.md](./wave-launch.md); дополнительно средний прогресс целей ≥ ориентира оператора (обычно 70%+ ключевых).  

События (analytics + activity_feed + notifications/system):

- `launch_goal_created`  
- `launch_goal_achieved`  
- `launch_goal_failed`  
- `launch_wave_completed`  

---

## Анализ результатов

| Инструмент | Назначение |
|---|---|
| Блок «Цели волны» + ProgressBar | Операционный контроль |
| LaunchMetrics / LaunchReport | Сводка факта |
| Лия: «Достигнуты ли цели запуска?» | `LaunchGoalReport` — summary, achieved, failed, risks, recommendations, next_actions (**только анализ**) |

Лия **не** изменяет `current_value` и статусы.

---

## ТИНДА

Production pilot case на closed wave: команда ТИНДА как пользователи волны; бизнес-цели по контактам, переговорам, партнёрам и сделкам.  
См. [tinda-production-case.md](./tinda-production-case.md).

---

## Миграция

`supabase/migrations/20260325440000_launch_goals.sql`
