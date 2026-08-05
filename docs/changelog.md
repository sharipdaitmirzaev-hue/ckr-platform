# Changelog ЦКР

Версия платформы отражается в интерфейсе бейджем **Beta**.

---

## 0.23.0-beta — 2026-03-25

Партнёрская сеть ЦКР.

### Изменения

- `organizations`, `organization_members`, `partnerships` + RLS
- Кабинет `/partner` (профиль, сотрудники, проекты, предложения, заявки)
- `organization_id` на projects / opportunities / investment_offers
- Сценарии Лии для организации
- Документация `docs/partners.md`

---

## 0.22.0-beta — 2026-03-25

Операционный центр ЦКР.

### Изменения

- `/operator` — OperatorStats, OperatorQueue, OperatorActivity, OperatorInsights
- Таблицы `tasks`, `operator_roles`, `sla_rules` + RLS `is_operator`
- Задачи со связями lead / project / deal / document / verification
- Базовые SLA: lead 24ч, application 48ч, verification 72ч
- Документация `docs/operator-center.md`

---

## 0.21.0-beta — 2026-03-25

CRM ЦКР: внутренняя система операторов.

### Изменения

- Таблицы `crm_contacts`, `leads`, `crm_activities` + RLS
- Dashboard `/admin/crm` (контакты, лиды, задачи, история)
- Конвертация лида с подтверждением администратора
- Архитектура Лии для оператора (`lia-operator`)
- Документация `docs/crm.md`

---

## 0.20.0-beta — 2026-03-25

Closed beta: подготовка к запуску для первых реальных пользователей.

### Изменения

- Система приглашений `beta_invites` и админка `/admin/invites`
- Обратная связь `feedback` и кнопка FeedbackButton
- Оценка ключевых сценариев `user_feedback_events`
- Beta badge с версией платформы
- Seed-категории и расширенное наполнение каталогов (без реальных ПДн)
- Документация `docs/beta-launch.md`

---

## 0.19.0 — продуктовое тестирование

- Сценарии прохождения и `/admin/product-tests`
- Задачи, чеклисты, статусы качества

---

## 0.18.0 — демонстрационный запуск

- Demo seed, онбординг, demo mode
- Публичные каталоги без регистрации

---

Формат записи: **версия · дата · изменения**.
Новые релизы добавляются сверху.
