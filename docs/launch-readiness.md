# ЦКР 1.0 — Launch Readiness Report

Этап 27: финальный аудит платформы как единого продукта перед запуском версии 1.0.

**Дата аудита:** 2026-03-25  
**Версия кода:** `0.27.0-beta` (кандидат 1.0)  
**Новые функции в этапе не добавлялись** — только аудит, документация и точечное выравнивание маршрутов.

Связанные материалы: [platform-overview.md](./platform-overview.md) · [security-audit.md](./security-audit.md) · [production-checklist.md](./production-checklist.md) · [core-audit.md](./core-audit.md)

---

## Вердикт

| Область | Оценка |
|---|---|
| Ядро продукта (проекты, заявки, Лия, кабинеты) | **Готово к closed launch / pilot** |
| End-to-end «как в презентации» для всех ролей | **Частично** — см. ограничения |
| Security / production prep (этап 26) | **Готово при выполнении checklist** |
| Публичный 1.0 без оговорок | **Не рекомендуется** до закрытия ограничений ниже |

**Рекомендуемый формат запуска 1.0:** controlled beta / pilot с приглашениями (`NEXT_PUBLIC_BETA_REQUIRE_INVITE=true`), demo mode выкл., mock payments.

---

## 1. Пользовательские сценарии

### 1.1. Предприниматель — **partial → ready for pilot**

```text
Регистрация → Онбординг → Лия → Проект → Анализ → Поиск решений → Заявки → Сделка
```

| Шаг | Статус | Реализация |
|---|---|---|
| Регистрация | ✅ | `/register` |
| Онбординг | ✅ | `/onboarding` → `/lia` |
| Лия | ✅ | `/lia`, сценарий `business_idea` |
| Создание проекта | ✅ | draft из Лии / формы |
| Анализ | ✅ | `/api/lia/analyze` + UI на edit/public |
| Поиск решений | ✅ | mode `find_solutions` |
| Заявки | ✅ | входящие/исходящие `/dashboard/applications` |
| Сделка | ⚠️ | workspace `/dashboard/projects/[id]/workspace`; **вручную** после принятия заявки |

**Требует внимания:** нет жёсткой связи `application_id` → `deal`; после accept открывается диалог (`/messages`), сделку создаёт владелец проекта.

---

### 1.2. Инвестор — **partial**

```text
Регистрация → Профиль → Поиск проектов → Интерес → Заявка → Сделка
```

| Шаг | Статус | Реализация |
|---|---|---|
| Регистрация | ✅ | роль `investor` |
| Профиль | ✅ | onboarding + settings; offers в `/dashboard/investments` |
| Поиск проектов | ✅ | `/projects` |
| Интерес | ❌ | избранное — stub `/dashboard/favorites` |
| Заявка | ✅ | `ApplicationButton` на проект / investment |
| Сделка | ⚠️ | только через владельца проекта (+ participant) |

**Ограничение для 1.0:** «интерес» = заявка (или публикация investment offer). Избранное — post-1.0.

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

### 1.4. Организация — **ready** (после выравнивания онбординга)

```text
Создание профиля → Сотрудники → Проекты → Партнёрство
```

| Шаг | Статус |
|---|---|
| Профиль org | ✅ `/partner` setup |
| Сотрудники | ✅ `/partner/members` |
| Проекты | ✅ `/partner/projects` + `organization_id` |
| Партнёрство | ✅ `/partner/profile` |

**Исправление этапа 27:** CTA роли `company` ведёт на `/partner` (ранее — create project).

---

### 1.5. Оператор ЦКР — **partial**

```text
CRM → Лиды → Задачи → Модерация → Сопровождение
```

| Шаг | Статус | Примечание |
|---|---|---|
| CRM / лиды | ⚠️ | CRUD в `/admin/crm` — **requireAdmin** |
| Задачи | ✅ | `/operator/tasks`, `requireOperator` |
| Модерация | ⚠️ | UI очереди в `/operator`, действия — admin |
| Сопровождение | ⚠️ | очередь сделок; работа — в project workspace |

**Ограничение:** полный операторский контур = admin **или** связка admin+operator. Чистый operator видит очередь/задачи, но не все CRM/модерационные mutations.

---

## 2. Проверка данных

| Связь | Состояние |
|---|---|
| `users` (Auth) ↔ `profiles` | ✅ trigger / RLS |
| `user_roles` | ✅ multi-role |
| `organizations` ↔ `organization_members` | ✅ |
| `projects.organization_id` | ✅ nullable FK |
| `opportunities` / `investment_offers`.`organization_id` | ✅ |
| `applications` → polymorphic target | ✅ (без FK на цель — by design) |
| `applications` → `conversations` (on accept) | ✅ trigger |
| `deals.project_id` → projects | ✅ |
| `deal_participants`, milestones, `project_activity` | ✅ workspace |
| `analytics_events` | ✅ ключевые события этапа 25–26 |
| `application` ↔ `deal` | ❌ прямой связи нет |
| favorites / interest | ❌ нет таблицы |

---

## 3. Проверка Лии

| Сценарий | Код | Док |
|---|---|---|
| Создание проекта (`business_idea`) | ✅ | ✅ |
| Анализ проекта | ✅ API analyze | ✅ |
| Поиск решений | ✅ find_solutions | ✅ |
| Реализация (`realize_project`) | ✅ | ✅ |
| Рекомендации пользователя | ✅ dashboard | ✅ |
| Рекомендации оператора | ✅ crm lia helper | ✅ |
| Org / reliability | ✅ | ✅ lia-flows |

Публичная страница `/solutions` остаётся маркетинговой/mock — реальный путь через Лию и проект.

---

## 4. Проверка доступа

| Роль | Gate | Статус |
|---|---|---|
| user (authenticated) | middleware dashboard/onboarding/partner/messages | ✅ `/messages` добавлен в matcher (этап 27) |
| organization member | `requirePartnerMembership` | ✅ |
| operator | middleware + `requireOperator` | ✅ |
| admin | middleware + `requireAdmin` | ✅ |
| blocked user | signOut | ✅ |

Подробнее: [roles-and-permissions.md](./roles-and-permissions.md).

---

## 5. Что готово

- Полный контур предпринимателя до заявки и ручной сделки  
- Каталоги: проекты, возможности, инвестиции, эксперты  
- Лия: 9 сценариев + analyze/find_solutions  
- Партнёрская сеть `/partner`  
- Репутация `/profile/[id]`  
- CRM (admin) + operator queue/tasks/SLA  
- Production prep: security audit, system_logs, deploy/backup docs  
- Lint/build зелёные на кандидате  

---

## 6. Что требует внимания перед публичным 1.0

1. **Application → Deal** — продуктовый bridge или явный UX «создать сделку из заявки».  
2. **Избранное / интерес инвестора** — либо убрать из навигации, либо реализовать.  
3. **Operator vs Admin** — дать operator права на модерацию/CRM или явно описать в runbook.  
4. **Платежи** — только mock; не обещать биллинг в 1.0.  
5. **Внешний LLM/search** — проверить ключи и лимиты; mock допустим для pilot.  
6. **`/solutions`** — согласовать копирайт с реальным путём через Лию.  
7. Выполнить [production-checklist.md](./production-checklist.md) на стенде.

---

## 7. Известные ограничения (accept for pilot 1.0)

- Нет мобильного API (перенесено после 1.0).  
- Нет favorites.  
- Нет автосоздания сделки из заявки.  
- Rate-limit Лии — in-memory (не multi-instance).  
- Payment provider = mock.  
- Demo seed и catalog fallback должны быть выключены в production.  
- Внешние результаты поиска Лии — непроверенные (by design).  

---

## 8. План запуска 1.0

### Фаза A — Closed pilot (рекомендуется как «1.0»)

1. Применить все миграции на production Supabase.  
2. Secrets по [deployment.md](./deployment.md); demo/seed off.  
3. `NEXT_PUBLIC_BETA_REQUIRE_INVITE=true`.  
4. Создать admin + 1–2 operator вручную.  
5. Smoke по [production-checklist.md](./production-checklist.md).  
6. Пилот: 5–15 организаций / предпринимателей по сценарию entrepreneur + investor.  
7. Сбор feedback (`/admin` beta feedback).  

### Фаза B — Open beta

1. Снять invite (или расширить когорты).  
2. Закрыть пункты §6 (1–3) по приоритету.  
3. Включить боевой `LIA_PROVIDER` при необходимости.  

### Фаза C — Public 1.0

1. Юридические страницы / поддержка.  
2. Backup drill ([backup.md](./backup.md)).  
3. Мониторинг `system_logs` + хостинг alerts.  
4. Тег релиза `v1.0.0` после зелёного pilot.

---

## 9. Финальные проверки кода (этап 27)

| Команда | Результат |
|---|---|
| `npm run lint` | см. отчёт агента / CI |
| `npm run build` | см. отчёт агента / CI |

---

## 10. Итог

Платформа ЦКР как **единый продукт для pilot / closed 1.0** — готова при условии соблюдения production checklist и явной коммуникации ограничений (избранное, auto-deal, operator≠admin, mock payments).

Для **открытого публичного 1.0 без оговорок** сначала закрыть §6.
