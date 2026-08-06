# Public Launch Decision Gate

Этап 57 · Версия `0.57.0-beta`  
UI: `/admin/public-launch-decision` · Лия: «Готов ли ЦКР к публичному запуску?»

Связано: [public-beta-launch-plan.md](./public-beta-launch-plan.md) · [open-beta-growth.md](./open-beta-growth.md) · [open-beta-launch-control.md](./open-beta-launch-control.md)

---

## Цель

Принять **управленческое решение** о выходе ЦКР из beta на полноценный публичный запуск.

На основе данных Open Beta оцениваются: продукт, пользователи, экосистема, бизнес и риски.

**Без новых крупных бизнес-модулей.** Лия только анализирует и **не принимает решение автоматически**.

---

## Критерии запуска

- Product / Technical без `blocked`
- Critical issues = 0
- D7 retention ≥ 25% и D30 ≥ 15%
- Есть реальные связи: заявки / интересы / сделки
- BusinessLaunchReadiness без `blocked`
- Нет блокирующих рисков LaunchRiskReview

---

## Блоки дашборда

| Блок | Содержание |
|---|---|
| Product Readiness | сайт, каталоги, карточки, регистрация, onboarding, Лия, кабинеты, сценарии |
| User Readiness | рост, удержание, активация, роли |
| Ecosystem Readiness | проекты, эксперты, инвесторы, организации, связи, заявки, сделки |
| BusinessLaunchReadiness | ценность, ТИНДА, коммерция, партнёры, монетизация |
| LaunchRiskReview | Product / Technical / User / Business / Ecosystem |
| PublicLaunchDecision | `public_launch` · `continue_beta` · `improve_product` |

Статусы проверок: `ready` · `needs_attention` · `blocked`.

---

## Принятое решение

Решение фиксируется формой на `/admin/public-launch-decision`:

| Поле | Источник |
|---|---|
| решение | выбор staff |
| комментарий | текст обоснования |
| ответственный | текущий staff (`created_by`) |
| дата | `created_at` |

Таблица: `public_launch_decisions` (миграция `20260325520000_public_launch_decision.sql`).

Система даёт **рекомендацию**; итог принимает команда.

---

## Следующие шаги

| Решение | Действия |
|---|---|
| `public_launch` | Следовать [public-beta-launch-plan.md](./public-beta-launch-plan.md): переход beta → public, контроль 90 дней |
| `continue_beta` | Донабор Open Beta Wave, усиление retention и связей |
| `improve_product` | Закрыть blocked / Critical, повторить Decision Gate |

Ежедневно после решения: Critical queue · активация · связи.  
Еженедельно: срез `/admin/open-beta-growth` и `/admin/public-launch-decision`.

---

## Лия

Сценарий `public_launch_decision` → `PublicLaunchDecisionReport`:

- summary  
- product_status · user_status · ecosystem_status · business_status  
- risks · recommendation  

Только анализ.
