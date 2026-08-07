# Open Beta Readiness

Этап 54 · Версия `0.54.0-beta`  
UI: `/admin/open-beta-review` · Лия: «Готов ли ЦКР к открытому запуску?»

Связано: [beta-expansion.md](./beta-expansion.md) · [open-beta-launch-plan.md](./open-beta-launch-plan.md) · [product-fix-sprint.md](./product-fix-sprint.md)

---

## Цель

Понять, готов ли ЦКР **выйти из закрытого режима** в Open Beta — без новых крупных бизнес-модулей.

Фокус: готовность продукта, UX, стабильность, качество экосистемы, план открытия доступа.

---

## Product Readiness

Проверки поверхностей:

| Проверка | Статусы |
|---|---|
| Публичный сайт | ready / needs_attention / blocked |
| Каталоги | |
| Карточки объектов | |
| Регистрация | |
| Onboarding | |
| Лия | |
| Кабинет | |

---

## User Readiness

| Роль | Смотрим |
|---|---|
| Предприниматели | регистрация, профиль, проекты, Лия, заявки |
| Эксперты | профиль, проверка, запросы |
| Инвесторы | проекты, интересы |
| Организации | профиль, возможности |

Данные берутся из Beta Expansion Wave и существующих сущностей.

---

## Ecosystem Readiness

Проекты · эксперты · инвесторы · организации · связи · заявки · сделки.

---

## TechnicalChecklist

- build (`npm run build`)
- lint (`npm run lint`)
- ошибки / Critical issues
- безопасность
- env
- производительность

---

## BusinessReadiness

- понятность позиционирования;
- понятность ролей;
- первые кейсы;
- пайплайн приглашений.

---

## OpenBetaDecision

| Решение | Смысл |
|---|---|
| `open_beta` | Можно открывать контролируемую Open Beta |
| `continue_beta` | Продолжить закрытую / расширенную beta |
| `needs_improvement` | Сначала закрыть блокеры |

Показывает причины, риски и следующие шаги. Решение принимает команда.

---

## Лия

Сценарий: «Готов ли ЦКР к открытому запуску?» → `OpenBetaReadinessReport`

`summary` · `product_readiness` · `user_readiness` · `ecosystem_readiness` · `risks` · `recommendations`

Только анализ.

---

## План открытия

См. [open-beta-launch-plan.md](./open-beta-launch-plan.md).
