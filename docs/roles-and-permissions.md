# Роли и права ЦКР

Единая карта ролей платформы (Этап 25).

---

## 1. Слои ролей

| Слой | Где хранится | Назначение |
|---|---|---|
| Пользовательские роли | `user_roles` + enum `user_role` | Доступ к сценариям платформы |
| Роли организации | `organization_members.role` | Кабинет `/partner` |
| Роли оператора | `operator_roles` | Кабинет `/operator` |
| Админ платформы | `user_roles.role = admin` | `/admin`, модерация, CRM |

Helpers RLS: `is_admin`, `has_role`, `is_operator`, `is_org_member`, `can_manage_org`.

---

## 2. Пользовательские роли (`user_role`)

| Роль | Видит | Может |
|---|---|---|
| entrepreneur | Каталоги, свой кабинет | Создавать проекты, заявки, сделки |
| investor | Каталоги, инвестиции | Создавать investment offers, заявки |
| expert | Каталоги, эксперты | Вести expert profile, принимать заявки |
| company | Каталоги + партнёрский контур | Создавать организацию `/partner` |
| admin | Всё + админ-панель | Модерация, роли, CRM, invites |

Пользователь может иметь несколько ролей. Admin назначается отдельно (не через onboarding).

Код: `src/config/roles.ts`, `src/lib/auth/require-admin.ts`.

---

## 3. Роли организации

| Роль | Права |
|---|---|
| owner | Полное управление организацией |
| manager | Профиль, сотрудники, предложения, проекты org |
| employee | Просмотр кабинета |

Код: `src/config/partners.ts`, `src/lib/auth/require-partner.ts`.

---

## 4. Роли оператора

| Роль | Контур |
|---|---|
| manager | Очередь, задачи, SLA |
| analyst | Аналитика и insights |
| moderator | Модерация контента |
| admin | Полный операторский доступ |

Доступ в `/operator`: platform admin **или** активная запись в `operator_roles`.

Код: `src/config/operator.ts`, `src/lib/auth/require-operator.ts`.

---

## 5. Матрица ключевых действий

| Действие | Кто |
|---|---|
| Создать проект | authenticated (обычно entrepreneur) |
| Отправить на модерацию | владелец проекта |
| Опубликовать проект | admin / moderator (из moderation) |
| Перевести в active / completed | владелец (после published) |
| Создать заявку | authenticated ≠ owner цели |
| Принять заявку | владелец цели |
| Создать сделку | участник workspace проекта |
| Загрузить документ | владелец |
| Выдать trust badge | admin |
| Управление CRM | admin **или** operator (`requireStaff`) |
| Модерация каталогов / верификации | admin **или** operator (`requireStaff`) |
| Users / invites / analytics / product-tests | admin |
| Задачи оператора | operator / admin |
| Управление org | owner / manager |

---

## 6. Видимость данных

| Сущность | Публично | Владелец | Admin/Operator |
|---|---|---|---|
| Проект `published/active/completed` | да | да | да |
| Проект `draft/moderation/archived` | нет | да | да |
| Приватные документы | нет | да | по политике review |
| Сделки / workspace | нет | участники | admin |
| Уведомления | нет | получатель | — |
| Репутация / отзывы | да | да | да |

---

## 7. Связанные документы

- [auth.md](./auth.md)
- [admin.md](./admin.md)
- [operator-center.md](./operator-center.md)
- [partners.md](./partners.md)
- [core-audit.md](./core-audit.md)
