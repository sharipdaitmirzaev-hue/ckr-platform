# Обзор платформы ЦКР

**ЦКР — Центр комплексных решений.**  
Партнёрство. Надёжность. Результат.

Логика: **Идея → анализ → поиск ресурсов → партнёры → реализация.**

Версия ядра после Этапа 25: `0.25.0-beta` (closed beta).

---

## 1. Архитектура

| Слой | Технология |
|---|---|
| UI / App | Next.js 14 App Router, TypeScript, Tailwind |
| Auth / DB | Supabase Auth + Postgres + RLS + Storage |
| AI-навигатор | Лия (`/lia`, server engine + providers) |
| Аналитика | `analytics_events` + админ-метрики |

Слои кода: `app` → `features` / `components` → `lib` → `config` / `types` → `supabase`.

Подробнее: [architecture.md](./architecture.md), [core-audit.md](./core-audit.md).

---

## 2. Основные модули

| Модуль | Маршруты | Документ |
|---|---|---|
| Auth и профили | `/login`, `/register`, `/onboarding`, `/profile/[id]` | auth.md |
| Проекты + lifecycle | `/projects`, `/dashboard/projects`, workspace | projects.md |
| Возможности | `/opportunities` | opportunities.md |
| Заявки и сообщения | `/dashboard/applications`, `/messages` | applications.md, notifications-and-communication.md |
| Инвестиции | `/investments` | investments.md |
| Эксперты | `/experts` | experts.md |
| Документы / верификация | `/dashboard/documents` | verification.md |
| Лия | `/lia` | lia.md, lia-flows.md |
| Сделки и workspace | `/dashboard/projects/[id]/workspace` | deals-and-workspace.md |
| Публичная платформа | `/`, SEO | public-platform.md |
| Монетизация | `/pricing`, billing | monetization.md |
| Аналитика | admin analytics | analytics.md |
| Demo / Beta | `/demo`, invites | demo-launch.md, beta-launch.md |
| CRM / Operator | `/admin/crm`, `/operator` | crm.md, operator-center.md |
| Партнёры | `/partner` | partners.md |
| Репутация | `/profile/[id]` | reputation.md |

---

## 3. Жизненный цикл проекта

```text
draft → moderation → published → active → completed → archived
```

- `stage` (idea/startup/…) — зрелость бизнеса  
- `status` — этап жизненного цикла на платформе  

Связи: applications, investments, deals, milestones, workspace, analytics, reputation.

---

## 4. Роли

- Пользователь: entrepreneur / investor / expert / company / admin  
- Организация: owner / manager / employee  
- Оператор: manager / analyst / moderator / admin  

Карта прав: [roles-and-permissions.md](./roles-and-permissions.md).

---

## 5. Пользовательские пути

1. **Предприниматель:** идея с Лией → проект → модерация → каталог → заявки → сделки → завершение.  
2. **Инвестор:** каталог / offers → заявки → сделки.  
3. **Эксперт:** профиль → заявки → сопровождение.  
4. **Организация:** `/partner` → проекты и предложения.  
5. **Оператор ЦКР:** CRM + очередь задач + SLA.  
6. **Админ:** модерация, роли, invites, метрики.

---

## 6. Центр пользователя

`/dashboard` — единый обзор:

- проекты и их этапы;
- заявки;
- инвестиции;
- сделки;
- уведомления;
- открытые этапы (задачи);
- рекомендации Лии;
- лента активности.

---

## 7. События

Важные действия пишут в:

- `notifications`
- `activity_feed` / `project_activity`
- `analytics_events`

Список и покрытие: [core-audit.md](./core-audit.md) §2.4, [notifications-and-communication.md](./notifications-and-communication.md).
