# Аудит безопасности ЦКР

Этап 26: подготовка к production. Новые бизнес-модули не добавлялись.

Дата: 2026-03-25.

---

## 1. Область проверки

- Supabase RLS и SECURITY DEFINER RPC
- API endpoints (`/api/lia`, `/api/demo/seed`)
- Server actions (документы, заявки, сделки, админ)
- Middleware (auth / admin / operator / partner)
- Роли и права ([roles-and-permissions.md](./roles-and-permissions.md))

---

## 2. Найденные риски и исправления

| Риск | Уровень | Исправление |
|---|---|---|
| `create_notification` — любой authenticated мог писать любому user_id | Высокий | Проверка: self / admin / operator **или** бизнес-тип + `related_id`/`application_id` |
| `log_activity_feed` — запись в чужую ленту | Средний | Только self или admin |
| GET `/api/lia` и `/api/lia/search/external` утекали provider/config | Средний | Публичный GET без внутренних деталей |
| Demo seed в production | Высокий | Блок при `NODE_ENV=production` без `ALLOW_DEMO_SEED_IN_PRODUCTION` |
| Загрузка документов без проверки related entity | Высокий | `assertDocumentRelatedAccess` |
| `error.tsx` показывал `error.message` | Средний | Пользовательское сообщение без технических деталей |
| Каталоги без limit (DoS/latency) | Средний | `CATALOG_LIST_LIMIT = 48` + индекс `(status, created_at)` |
| Нет операционных логов | Средний | Таблица `system_logs` + `writeSystemLog` |

---

## 3. Middleware

| Маршрут | Защита |
|---|---|
| `/dashboard`, `/onboarding` | login |
| `/admin/*` | login + role admin |
| `/operator/*` | login + admin или active operator_roles |
| `/partner/*` | login; членство org — на страницах (`requirePartner*`) |
| Заблокированный пользователь | signOut → `/login?error=blocked` |

**Рекомендация:** при появлении чувствительных partner API — дублировать org-check в middleware.

---

## 4. API

Единый формат: `{ ok, error?, code? }` — `src/lib/errors/api.ts`.

| Endpoint | Auth | Логирование |
|---|---|---|
| POST `/api/lia` | да + rate limit | system_logs |
| POST `/api/lia/analyze` | да + owner проекта | system_logs |
| POST `/api/lia/search/external` | да + rate limit | system_logs |
| POST `/api/demo/seed` | secret + prod gate | system_logs |

Rate limit Лии — in-memory (не shared между инстансами). Для multi-instance — Redis/Upstash.

---

## 5. RLS

- Бизнес-таблицы с `ENABLE ROW LEVEL SECURITY` (аудит этапа 25 подтверждён).
- `system_logs`: select — admin/operator; insert — admin или RPC `write_system_log`.

---

## 6. Рекомендации после 1.0

1. Вынести rate-limit Лии в общее хранилище.
2. CSP / security headers в Next config.
3. Аудит Storage signed URLs TTL.
4. Регулярный review SECURITY DEFINER функций.
5. Sentry/OpenTelemetry поверх `system_logs`.
6. WAF / bot protection на `/api/*`.

---

## 7. Миграция

`supabase/migrations/20260325350000_system_logs_and_security.sql`
