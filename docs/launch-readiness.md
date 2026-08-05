# ЦКР 1.0 — Launch Readiness Report

Этап 27: финальный аудит платформы как единого продукта.  
Этап 28: закрытие критических ограничений для **closed pilot**.

**Дата аудита:** 2026-03-25  
**Обновление closed pilot:** 2026-03-25 (этап 28)  
**Версия кода:** `0.28.0-beta` (closed pilot)  

Связанные материалы: [platform-overview.md](./platform-overview.md) · [security-audit.md](./security-audit.md) · [production-checklist.md](./production-checklist.md) · [core-audit.md](./core-audit.md)

---

## Вердикт

| Область | Оценка |
|---|---|
| Ядро продукта (проекты, заявки, сделки, Лия, кабинеты) | **Готово к closed pilot** |
| End-to-end критические пути (entrepreneur / investor / operator) | **Готово к closed pilot** |
| Security / production prep (этап 26) | **Готово при выполнении checklist** |
| Публичный 1.0 без оговорок | **Не рекомендуется** — остаются mock payments, внешний LLM, `/solutions` |

**Рекомендуемый формат запуска:** controlled beta / closed pilot с приглашениями (`NEXT_PUBLIC_BETA_REQUIRE_INVITE=true`), demo mode выкл., mock payments.

**Статус closed pilot:** готов к запуску после применения миграции `20260325360000_closed_pilot.sql` и smoke по [production-checklist.md](./production-checklist.md).

---

## Этап 28 — что закрыто

| Ограничение (этап 27) | Статус | Реализация |
|---|---|---|
| Application → Deal | ✅ | `deals.application_id`, кнопка «Создать сделку», redirect в workspace |
| Интерес инвестора | ✅ | `investor_interests`, кнопка «Интересно», `/dashboard/interests` |
| Operator ≠ Admin (CRM / модерация) | ✅ | `requireStaff`, middleware staff paths, sidebar без admin-only |
| Лия без контекста интересов/заявок/сделок | ✅ | `buildLiaRecommendations` учитывает интересы, заявки, сделки |

Путь пилота:

```text
Проект → Заявка (accepted) → Создать сделку → Deal workspace
```

---

## 1. Пользовательские сценарии

### 1.1. Предприниматель — **ready for closed pilot**

```text
Регистрация → Онбординг → Лия → Проект → Анализ → Поиск решений → Заявки → Сделка → Workspace
```

| Шаг | Статус | Реализация |
|---|---|---|
| Регистрация | ✅ | `/register` |
| Онбординг | ✅ | `/onboarding` → `/lia` |
| Лия | ✅ | `/lia`, сценарий `business_idea` |
| Создание проекта | ✅ | draft из Лии / формы |
| Анализ | ✅ | `/api/lia/analyze` + UI на edit/public |
| Поиск решений | ✅ | mode `find_solutions` |
| Заявки | ✅ | `/dashboard/applications` |
| Сделка | ✅ | «Создать сделку» из accepted project application → workspace |

---

### 1.2. Инвестор — **ready for closed pilot**

```text
Регистрация → Профиль → Поиск проектов → Интерес → Заявка → Сделка
```

| Шаг | Статус | Реализация |
|---|---|---|
| Регистрация | ✅ | роль `investor` |
| Профиль | ✅ | onboarding + settings; offers в `/dashboard/investments` |
| Поиск проектов | ✅ | `/projects` |
| Интерес | ✅ | `investor_interests` + «Интересно» + `/dashboard/interests` |
| Заявка | ✅ | `ApplicationButton` |
| Сделка | ✅ | через владельца проекта (participant + workspace) |

---

### 1.3. Эксперт — **ready**

```text
Профиль → Верификация → Получение запросов
```

| Шаг | Статус |
|---|---|
| Профиль эксперта | ✅ `/dashboard/expert`, публично `/expert/[id]` |
| Верификация | ✅ документы + `/admin/verifications` |
| Заявки | ✅ target_type `expert` → `/dashboard/applications` |

---

### 1.4. Организация — **ready**

```text
Создание профиля → Сотрудники → Проекты → Партнёрство
```

| Шаг | Статус |
|---|---|
| Профиль org | ✅ `/partner` setup |
| Сотрудники | ✅ `/partner/members` |
| Проекты | ✅ `/partner/projects` + `organization_id` |
| Партнёрство | ✅ `/partner/profile` |

---

### 1.5. Оператор ЦКР — **ready for closed pilot**

```text
CRM → Лиды → Задачи → Модерация → Сопровождение
```

| Шаг | Статус | Примечание |
|---|---|---|
| CRM / лиды | ✅ | `/admin/crm` — `requireStaff` (admin **или** operator) |
| Задачи | ✅ | `/operator/tasks` |
| Модерация | ✅ | проекты / возможности / инвестиции / эксперты / верификации |
| Пользователи / invites / analytics | 🔒 | только platform **admin** |
| Сопровождение | ✅ | очередь + project workspace |

Оператор работает без полного admin-доступа.

---

## 2. Проверка данных

| Связь | Состояние |
|---|---|
| `users` (Auth) ↔ `profiles` | ✅ |
| `user_roles` | ✅ multi-role |
| `organizations` ↔ `organization_members` | ✅ |
| `projects.organization_id` | ✅ |
| `applications` → polymorphic target | ✅ |
| `applications` → `conversations` (on accept) | ✅ |
| `deals.project_id` → projects | ✅ |
| `deals.application_id` → applications | ✅ (этап 28, unique where not null) |
| `investor_interests` | ✅ (этап 28) |
| `deal_participants`, milestones, `project_activity` | ✅ |
| `analytics_events` | ✅ |

---

## 3. Проверка Лии

| Сценарий | Статус |
|---|---|
| Создание / анализ / поиск решений / реализация | ✅ |
| Рекомендации пользователя | ✅ + интересы / заявки / сделки |
| Рекомендации оператора | ✅ crm lia helper |

---

## 4. Проверка доступа

| Роль | Gate | Статус |
|---|---|---|
| user | middleware dashboard/onboarding/partner/messages | ✅ |
| organization member | `requirePartnerMembership` | ✅ |
| operator | middleware + `requireOperator` / `requireStaff` | ✅ |
| admin | middleware + `requireAdmin` | ✅ |
| staff (admin\|operator) | CRM + moderation paths | ✅ этап 28 |
| blocked user | signOut | ✅ |

Подробнее: [roles-and-permissions.md](./roles-and-permissions.md).

---

## 5. Что готово (closed pilot)

- Контур предпринимателя: проект → заявка → сделка → workspace  
- Интересы инвестора и список `/dashboard/interests`  
- Operator: CRM + модерация без полного admin  
- Лия с контекстом интересов / заявок / сделок  
- Каталоги, партнёрская сеть, репутация  
- Production prep: security audit, system_logs, deploy/backup docs  

---

## 6. Что осталось (после closed pilot / перед публичным 1.0)

1. **Платежи** — только mock; не обещать биллинг в 1.0.  
2. **Внешний LLM/search** — ключи и лимиты; mock допустим для pilot.  
3. **`/solutions`** — согласовать копирайт с реальным путём через Лию.  
4. Выполнить [production-checklist.md](./production-checklist.md) на стенде.  
5. Юридические страницы / поддержка / backup drill для public 1.0.  
6. Мобильный API — отдельный этап после pilot.

---

## 7. Известные ограничения (accept for closed pilot)

- Нет мобильного API.  
- Rate-limit Лии — in-memory (не multi-instance).  
- Payment provider = mock.  
- Demo seed и catalog fallback должны быть выключены в production.  
- Внешние результаты поиска Лии — непроверенные (by design).  

---

## 8. План запуска

### Фаза A — Closed pilot (текущий целевой статус)

1. Применить миграции, включая `20260325360000_closed_pilot.sql`.  
2. Secrets по [deployment.md](./deployment.md); demo/seed off.  
3. `NEXT_PUBLIC_BETA_REQUIRE_INVITE=true`.  
4. Создать admin + 1–2 operator (`operator_roles`).  
5. Smoke по [production-checklist.md](./production-checklist.md).  
6. Пилот: 5–15 организаций; сценарии entrepreneur + investor + operator.  
7. Feedback через `/admin` (admin).  

### Фаза B — Open beta

1. Снять / расширить invite.  
2. Закрыть пункты §6 по приоритету.  
3. Боевой `LIA_PROVIDER` при необходимости.  

### Фаза C — Public 1.0

1. Юридические страницы / поддержка.  
2. Backup drill ([backup.md](./backup.md)).  
3. Мониторинг `system_logs` + хостинг alerts.  
4. Тег релиза `v1.0.0` после зелёного pilot.

---

## 9. Проверки кода (этап 28)

| Команда | Результат |
|---|---|
| `npm run lint` | (заполнить после прогона) |
| `npm run build` | (заполнить после прогона) |

---

## 10. Итог

Платформа ЦКР **готова к closed pilot**: критические разрывы application→deal, интерес инвестора и доступ оператора закрыты. Новые крупные модули не добавлялись.

Для **открытого публичного 1.0** закрыть оставшиеся пункты §6 и выполнить production checklist на боевом стенде.
