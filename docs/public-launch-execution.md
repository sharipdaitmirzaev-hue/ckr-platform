# Public Launch Execution

Этап 58 · Версия `0.58.0-beta`  
UI: `/admin/public-launch` · KPI: `/admin/public-launch-kpi` · Лия: «Как проходит публичный запуск ЦКР?»

Связано: [public-launch-decision.md](./public-launch-decision.md) · [public-beta-launch-plan.md](./public-beta-launch-plan.md) · [open-beta-growth.md](./open-beta-growth.md)

---

## Цель

Организованный выход ЦКР из beta в публичный режим: управление запуском, первые 90 дней, каналы, KPI и feedback loop.

**Без новых крупных бизнес-модулей.**

---

## Порядок запуска

1. Пройти Decision Gate: `/admin/public-launch-decision`.
2. Зафиксировать `PublicLaunchDecision = public_launch` (иначе запуск не активируется).
3. На `/admin/public-launch` подтвердить активацию → волна `planned → active`.
4. Вести приглашения с `source=public_launch_wave` и каналами LaunchChannels.
5. Контролировать KPI на `/admin/public-launch-kpi` и feedback → improvements.

| Решение Gate | Действие |
|---|---|
| `public_launch` | Можно активировать Public Launch Wave 1 |
| `continue_beta` | Продолжать Open Beta, public не стартует |
| `improve_product` | Остановить запуск, работать над улучшениями |

---

## Роли команды

| Роль | Зона |
|---|---|
| Product / Ops | Активация волны, Critical queue, health |
| Growth | Каналы привлечения, invites, активация |
| Community / Partners | Партнёры, мероприятия, организации |
| Support | Feedback `public_launch` → issues → improvements |
| Leadership | Decision Gate, контрольные точки 30/60/90 |

---

## Public Launch Wave 1

- Название: **Public Launch Wave 1**
- Тип: `public`
- Статус seed: `planned`
- После подтверждения решения: `planned → active`
- ID: `LAUNCH_WAVE_IDS.publicLaunch`

---

## KPI

### Product

- регистрации · активация · retention (D7 / D30)

### Ecosystem

- проекты · эксперты · связи · заявки

### Business

- партнёрства · сделки · коммерческие результаты · feedback public_launch

---

## Контрольные точки

| День | Фокус |
|---|---|
| 0 | Активация волны при `public_launch` |
| 14 | Critical = 0, smoke путей, первые регистрации |
| 30 | Стабильность + активация + Лия + первые проекты |
| 60 | Рост экосистемы: проекты, эксперты, партнёры, заявки |
| 90 | Масштабирование: сделки, удержание, коммерция |

Ежедневно: Critical · активация · связи.  
Еженедельно: `/admin/public-launch-kpi` + retention.  
Ежемесячно: срез Decision / Execution.

---

## Первые 90 дней (PublicLaunch90Days)

### Дни 1–30 — стабильность и первые пользователи

Метрики: регистрации · активация · Лия · первые проекты.

### Дни 31–60 — рост экосистемы

Метрики: новые проекты · эксперты · партнёры · заявки.

### Дни 61–90 — масштабирование

Метрики: сделки · удержание · коммерческие результаты.

---

## LaunchChannels

- рекомендации (`referral`)
- партнёры (`partner`)
- мероприятия (`events`)
- социальные сети (`social`)
- контент (`content`)
- прямые приглашения (`email`)

Связь: `beta_invites.channel` + `source=public_launch_wave`.

---

## Feedback

Цепочка: Public users → Feedback (`category=public_launch`) → Issues → Improvements.

---

## Лия

Сценарий `public_launch` → `PublicLaunchReport` (только анализ):

summary · users · activation · ecosystem · business_results · risks · recommendations
