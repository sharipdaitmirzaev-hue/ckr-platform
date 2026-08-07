# Go-Live ЦКР (Production Deployment)

Этап 64. Переход в production-окружение без новых бизнес-модулей.

Дата запуска (код): **2026-08-07** · версия **0.64.0-beta**.

---

## 1. Окружение

| Параметр | Ожидание |
|---|---|
| Хостинг | Next.js production (Vercel / Node / Docker) |
| БД / Auth / Storage | Supabase |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |
| `DEMO_CATALOG_FALLBACK` | `false` |
| `ALLOW_DEMO_SEED_IN_PRODUCTION` | `false` |
| `NEXT_PUBLIC_SITE_URL` | production HTTPS URL |
| Миграции | включая `20260325580000_production_go_live.sql` |

Операционный дашборд: **`/admin/system-health`**.

См. также: [deployment.md](./deployment.md), [production-checklist.md](./production-checklist.md), [security-audit.md](./security-audit.md), [backup.md](./backup.md).

---

## 2. Проверенные сценарии (ProductionSmokeTest)

| Роль | Цепочка |
|---|---|
| Предприниматель | Регистрация → Профиль → Лия → Создание проекта |
| Эксперт | Регистрация → Профиль → Верификация |
| Инвестор | Регистрация → Просмотр проекта → Интерес |
| Организация | Регистрация → Профиль → Партнёрство |

Статусы на дашборде выводятся по наличию данных + требуют ручного прогона на реальных аккаунтах перед go-live.

---

## 3. Известные ограничения

- Платежи: `PAYMENT_PROVIDER=mock` (реальных платежей нет).
- Лия может работать в `mock` — для production предпочтителен боевой provider.
- Часть пунктов Deployment / Recovery checklist — **manual** (хостинг, SSL, restore на staging).
- Analytics `lia_used` пишется через pilot metrics; aliases включают `lia_started` / `first_lia_use`.
- Решение `ProductionLaunchDecision` фиксируется вручную staff/admin (go_live / hold / rollback).

---

## 4. План поддержки после запуска

1. Ежедневно: `/admin/system-health` — Services, Analytics, smoke-сигналы.  
2. При error сервисов — hold/rollback по [deployment.md](./deployment.md) § откат.  
3. Backup/restore — [backup.md](./backup.md); RecoveryChecklist на system-health.  
4. Feedback → `/admin/improvements`; коммерция → `/admin/revenue`.  
5. Лия production-анализ: сценарий «Как Лия работает в production?» → `LiaProductionReport`.

---

## 5. Артефакты этапа

- `ProductionDeploymentChecklist` (Infrastructure / Security / Product / Business)
- `ProductionSmokeTest`
- `AccessAudit` (+ RLS)
- `RecoveryChecklist`
- `ProductionLaunchDecision` (`production_launch_decisions`)
- `LiaProductionReport`
