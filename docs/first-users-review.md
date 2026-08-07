# First Users Review

Этап 51 · Версия `0.51.0-beta`  
UI: `/admin/first-users-review` · Лия: «Что показал первый запуск ЦКР?»

Связано: [first-users-wave.md](./first-users-wave.md) · [first-users-launch.md](./first-users-launch.md) · [product-improvement-loop.md](./product-improvement-loop.md)

---

## Цель анализа

На данных **First Users Wave** понять реальное поведение первой группы пользователей и принять решение о следующем этапе — без новых крупных бизнес-модулей и без массового запуска «вслепую».

Фокус:

- воронка активации;
- сценарии по ролям;
- Лия;
- feedback → issues → improvements;
- решение: continue_closed / expand_beta / prepare_public.

---

## Метрики

### Воронка

```text
Приглашено → Регистрация → Роль → Профиль → Первое действие → Лия → Создание объекта
```

На каждом шаге: количество, % перехода, потери.

### Роли

| Роль | Смотрим |
|---|---|
| Предприниматели | регистрация, проекты, Лия, заявки |
| Эксперты | профиль, верификация, активность |
| Инвесторы | просмотры, интересы, заявки |
| Организации | профиль, проекты, возможности |

### Лия — FirstUsersLiaReport

`summary` · `used_scenarios` · `successful_flows` · `blocked_flows` · `recommendations`

### Product Issues Review

Категории: Critical / High / Medium / Low.  
Для каждой: проблема, сколько пользователей, влияние, решение.

Цепочка: `feedback → pilot_issues → product_improvements`.

---

## Результаты

Формируются в `/admin/first-users-review` и в отчёте Лии `FirstUsersReviewReport`:

- summary  
- activation  
- user_behavior  
- successful_cases  
- main_problems  
- recommendations  

Результаты заполняются по живой когорте после применения миграции волны и приглашений.

---

## Проблемы

Сводятся из:

- потерь воронки (где остановились);
- `pilot_issues` / `product_improvements`;
- structured feedback (понравилось / непонятно / мешает);
- blocked flows Лии.

---

## Решение — FirstUsersDecision

| Вариант | Когда |
|---|---|
| `continue_closed` | critical есть или когорта/активация слабые |
| `expand_beta` | активация стабильна, critical нет, можно расширять |
| `prepare_public` | цели волны выполнены, critical нет, есть объекты и feedback |

На дашборде: готовность продукта, риски, необходимые улучшения.

---

## ТИНДА

Блок «Кейс ТИНДА и первые пользователи»:

- понятно ли описание (`/cases`);
- вызывает ли интерес (просмотры / feedback);
- какие вопросы возникают.

---

## Что не делаем

- не добавляем новые бизнес-функции;
- не делаем массовый public launch из этого этапа;
- решение — аналитическое, на реальном поведении.
