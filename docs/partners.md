# Партнёрская сеть ЦКР

Этап 23: участие организаций в экосистеме ЦКР.

Кабинет: `/partner`.

---

## 1. Организации — `organizations`

| Поле | Описание |
|---|---|
| name | Название |
| type | company · bank · fund · supplier · university · association · government · other |
| description / website | Профиль |
| region / city | География |
| verification_status | unverified · pending · verified |

Создать организацию можно на `/partner` (форма setup). Создатель становится `owner`.

---

## 2. Участники — `organization_members`

| Роль | Права |
|---|---|
| owner | Полное управление |
| manager | Профиль, сотрудники, предложения, проекты |
| employee | Просмотр кабинета |

Уникальность: `(organization_id, user_id)`.

---

## 3. Партнёрства — `partnerships`

Типы: strategic · supplier · investment · technology · expert  
Статусы: pending · active · inactive

Оформляются в `/partner/profile`.

---

## 4. Кабинет `/partner`

| Раздел | Маршрут |
|---|---|
| Обзор + Лия | `/partner` |
| Профиль организации | `/partner/profile` |
| Сотрудники | `/partner/members` |
| Проекты | `/partner/projects` |
| Предложения | `/partner/offers` |
| Заявки | `/partner/applications` |

Доступ: авторизованный пользователь. Разделы кроме setup требуют членства в организации.

---

## 5. Связь с экосистемой

На сущностях платформы добавлено поле `organization_id` (nullable):

- `projects`
- `opportunities`
- `investment_offers`

Организация может:

- создавать проекты (участие);
- создавать возможности / услуги;
- создавать инвестиционные предложения;
- получать и отправлять заявки через сотрудников.

Owner сущности — пользователь-сотрудник; организация связывается через `organization_id`.

---

## 6. Лия для организации

Сценарии (подготовка + ответы в движке):

- «Найди подходящие проекты для нашей организации» → `org_find_projects`
- «Какие возможности мы можем предложить» → `org_offer_opportunities`

Контракт и подсказки: `src/lib/partners/lia-scenarios.ts`  
Конфиг: `src/config/lia.ts`  
Движок: `src/lib/lia/engine.ts`

Лия только рекомендует, не создаёт заявки и публикации.

---

## 7. RLS

- Helpers: `is_org_member`, `can_manage_org`
- Организации: публично видны `verified`; участники видят свои; manage — owner/manager/admin
- Участники и партнёрства — по членству / правам управления

---

## 8. Код

| Слой | Путь |
|---|---|
| Миграция | `supabase/migrations/20260325320000_partners.sql` |
| Конфиг | `src/config/partners.ts` |
| Queries | `src/lib/partners/queries.ts` |
| Actions | `src/features/partners/actions.ts` |
| UI | `src/app/(partner)/*`, `src/components/partners/*` |
