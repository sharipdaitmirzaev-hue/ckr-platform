# Wave Launch — волновой запуск ЦКР

Этап 41. Версия: `0.41.0-beta`  
База: [public-launch-plan.md](./public-launch-plan.md) · [public-launch-checklist.md](./public-launch-checklist.md) · UI: `/admin/launch`

Новые крупные бизнес-модули **не** входят в scope.

---

## Порядок волн

| Волна | Тип (`wave_type`) | Статус по умолчанию | Смысл |
|---|---|---|---|
| **0 — Internal** | `internal` | `completed` | Команда, демо, closed pilot / controlled beta |
| **1 — Closed** | `closed` | `active` | Расширенный invite-доступ после Conditional Go; кейс ТИНДА |
| **2 — Public** | `public` | `planned` | Ограниченный public / waitlist |

Статусы волны: `planned` → `active` → `completed`. Одновременно рекомендуется **одна** `active`.

Участники волны (`launch_wave_participants`): `invited` → `joined` → `active` → `completed` (или `left`).

---

## Критерии перехода

### Internal → Closed (волна 1)

- Conditional Go по beta review / launch checklist  
- Critical/high issues закрыты или явно запланированы  
- Онбординг-путь с подсказками работает  
- Seed / кейс ТИНДА воспроизводим  

### Closed → Public (волна 2)

Ориентиры (см. LaunchReport на `/admin/launch`):

| Метрика | Ориентир |
|---|---|
| Активация участников волны | ≥ 60% |
| Завершение onboarding | рост week-over-week |
| Создание проектов | ≥ 30% от активированных |
| Использование Лии | ≥ 40% от активированных |
| Заявки / сделки | ненулевой поток |
| Open critical issues | 0 дольше 7 дней |

Перед переключением: lint/build, LaunchStatusReport Лии, решение оператора.

### Public → Open (опционально)

Только после стабильных метрик волны 2 — вне обязательного scope этапа 41.

---

## Метрики успеха

**LaunchReport** (с даты старта активной волны):

- новые пользователи  
- завершение onboarding  
- создание проектов  
- использование Лии  
- заявки  
- сделки  
- activation_rate участников волны  

**Операционно на `/admin/launch`:**

- текущая волна  
- участники и статусы  
- активация / активность 7д  
- проблемы (pilot_issues + improvements)  
- результаты  
- блок ТИНДА production pilot case  

**Лия:** сценарий «Как проходит запуск?» → `LaunchStatusReport` (активность, блокеры, рекомендации; только анализ).

---

## Таблицы

- `launch_waves` — id, name, description, status, wave_type, start_date, end_date, created_at  
- `launch_wave_participants` — wave_id, user_id, status, notes, created_at  

Миграция: `supabase/migrations/20260325430000_wave_launch.sql`.

---

## ТИНДА

Статус кейса: **production pilot case** (волна 1 closed).  
Публичное описание: [tinda-case-public.md](./tinda-case-public.md).  
Seed: `npm run seed:tinda` добавляет участника в волну closed.
