# Развёртывание ЦКР (production)

Этап 26 (база) + этап 64 (Go-Live). Без новых бизнес-функций — подготовка и контроль реальной эксплуатации.

Операционный дашборд: **`/admin/system-health`**.  
Решение о запуске: **ProductionLaunchDecision** (`go_live` / `hold` / `rollback`).  
См. [go-live.md](./go-live.md).

---

## 1. Требования

- Node.js 20+
- Supabase project (Auth, Postgres, Storage)
- Хостинг Next.js (Vercel / Node server / Docker)

---

## 2. Переменные окружения

См. `.env.example`. Минимум для production:

| Переменная | Назначение |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Канонический URL сайта |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публичный anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Только сервер (seed/admin scripts) |
| `LIA_PROVIDER` | `mock` или `openai` |
| `LIA_API_KEY` / `LIA_API_BASE_URL` / `LIA_MODEL` | LLM (если не mock) |
| `LIA_WEB_SEARCH_*` | Внешний поиск (если не mock) |
| `PAYMENT_PROVIDER` | Пока `mock` |
| `NEXT_PUBLIC_DEMO_MODE` | **`false` в production** |
| `DEMO_CATALOG_FALLBACK` | **`false` в production** |
| `DEMO_SEED_SECRET` | Сильный секрет или пусто |
| `ALLOW_DEMO_SEED_IN_PRODUCTION` | **`false`** |
| `NEXT_PUBLIC_BETA_REQUIRE_INVITE` | по политике запуска |

Storage: бакет `documents` создаётся миграцией verification.

---

## 3. Шаги деплоя

1. Создать Supabase project, включить Email Auth.  
2. Применить миграции: `supabase db push` или SQL Editor по порядку файлов в `supabase/migrations/`.  
3. Проверить Storage bucket `documents` и RLS политик.  
4. Задать secrets на хостинге (не коммитить `.env.local`).  
5. `npm ci && npm run build && npm run start` (или платформенный build).  
6. Smoke-check: `/`, `/login`, `/dashboard`, `/lia`, admin login.  
7. Выключить demo mode и seed.  
8. Открыть `/admin/system-health`: Environment, Services, DeploymentChecklist, SmokeTest.  
9. Зафиксировать `ProductionLaunchDecision` (go_live / hold / rollback).

Чеклист: [production-checklist.md](./production-checklist.md) · [go-live.md](./go-live.md).

---

## 4. Рекомендуемые настройки Auth

- Confirm email: **включено** в production  
- Secure password policy  
- Redirect URLs: только домены production / preview  
- Не использовать service role в клиенте  

---

## 5. Мониторинг

- `/admin/system-health` — Services (database, auth, storage, analytics, notifications, Lia)  
- Таблица `system_logs` (admin/operator select)  
- `analytics_events` для продуктовых метрик (registration, projects, lia, deals, revenue)  
- Логи хостинга / Supabase logs  

---

## 6. Откат

- Откат приложения: предыдущий деплой образа/коммита  
- Откат БД: точечный down-migration только при наличии плана; иначе restore из backup ([backup.md](./backup.md))  
- Зафиксировать решение `rollback` в ProductionLaunchDecision на `/admin/system-health`  
