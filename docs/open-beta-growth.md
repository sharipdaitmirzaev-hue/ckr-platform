# Open Beta Growth

Этап 56 · Версия `0.56.0-beta`  
UI: `/admin/open-beta-growth` · Лия: «Почему пользователи возвращаются в ЦКР?»

Связано: [public-launch-decision.md](./public-launch-decision.md) · [open-beta-launch-control.md](./open-beta-launch-control.md) · [open-beta-first-30-days.md](./open-beta-first-30-days.md) · [open-beta-readiness.md](./open-beta-readiness.md)

---

## Цель

Понять, создаёт ли ЦКР **постоянную ценность** после запуска Open Beta: удержание, повторное использование, ценность для ролей, качество взаимодействий.

**Без новых крупных бизнес-модулей** — только аналитика поверх уже существующих сущностей:

`open_beta` · `analytics_events` · `profiles` · `projects` · `experts` · `investments` · `opportunities` · `organizations` · `applications` · `deals` · `lia_sessions` · `feedback`

---

## Рост

Дашборд показывает:

| Метрика | Смысл |
|---|---|
| Новые регистрации | Приглашённые Open Beta, прошедшие регистрацию |
| Активные пользователи | Пользователи с повторной / значимой активностью волны |
| Активные роли | Предприниматель · Эксперт · Инвестор · Организация |
| Источники / каналы | `beta_invites.source` и `channel` |

Когорта retention предпочтительно строится по `beta_invites` с `source=open_beta_wave` и `used_by`.

---

## Удержание (RetentionMetrics)

Окна: **Day 1 · Day 7 · Day 14 · Day 30** — доля пользователей когорты, у которых есть событие в соответствующий день после первого контакта.

Срез по ролям:

- Предприниматели
- Эксперты
- Инвесторы
- Организации

Вернувшийся = есть активность на день ≥ 1 относительно первого события.

---

## Ценность действий

Аналитика lift: покрытие цепочки у returned vs one-time.

Примеры цепочек:

1. Лия → создание проекта → поиск эксперта → заявка  
2. Просмотр проекта → интерес инвестора → контакт  
3. Профиль эксперта → запрос → взаимодействие  

Только корреляции для онбординга — без новых продуктовых фич.

---

## Метрики экосистемы (GrowthEcosystemMetrics)

- новые связи (проекты + интересы);
- активные взаимодействия (экспертные);
- заявки;
- интересы;
- сделки.

---

## Отчёты

| Отчёт | Содержание |
|---|---|
| `RetentionReport` | summary, returning_users, valuable_actions, drop_off_points, recommendations |
| `RoleGrowthReport` | ценность по ролям |
| `UserValueFeedbackReport` | активные → отзывы → improvements |
| `OpenBetaGrowthDecision` | scale_public / continue_growth / improve_retention |

Лия (`open_beta_growth`) отдаёт аналитические карточки, не создаёт сущности.

---

## Решение после Open Beta

| Решение | Когда |
|---|---|
| `scale_public` | D7 ≥ 25%, D30 ≥ 15%, Лия среди вернувшихся ≥ 40%, есть связи, Critical = 0 |
| `continue_growth` | D7 ≥ 15% и доля вернувшихся ≥ 20%, но масштабирование рано |
| `improve_retention` | слабое удержание, мало регистраций, Critical открыты |

### Критерии масштабирования

- D7 retention ≥ 25%
- D30 retention ≥ 15%
- ≥40% вернувшихся использовали Лию или создали объект
- Есть заявки / интересы / сделки
- Critical issues = 0

---

## Контроль

| Инструмент | Назначение |
|---|---|
| `/admin/open-beta-growth` | Рост, retention, ценность, решение |
| `/admin/open-beta` | Операционный контроль Wave 1 |
| `/admin/improvements` | Feedback → issues → improvements |
| Лия `open_beta_growth` | RetentionReport (только анализ) |
