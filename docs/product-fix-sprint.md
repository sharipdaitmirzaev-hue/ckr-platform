# Product Fix Sprint

Этап 52 · Версия `0.52.0-beta`  
UI: `/admin/product-sprint` · Лия: «Что улучшилось после исправлений?»

Связано: [first-users-review.md](./first-users-review.md) · [first-users-wave.md](./first-users-wave.md) · [product-improvement-loop.md](./product-improvement-loop.md)

---

## Цель

Исправить критичные и важные проблемы First Users Review **без новых крупных бизнес-модулей**: активация, первый опыт, понятность сценариев, Лия, UX.

Источники: `product_improvements`, `pilot_issues`, `feedback`, `analytics_events`, First Users Review.

---

## Найденные проблемы

| Приоритет | Проблема | Источник |
|---|---|---|
| Critical | Неясный первый шаг после профиля | first_users_review |
| Critical | Путь ролей не сформулирован коротко | first_users_review |
| High | Лия: слабый мост к действию | feedback |
| High | Empty states без следующего шага | analytics |
| High | Регистрация: неочевиден путь к Лие | feedback |
| Medium | Доверие эксперта неочевидно | first_users_review |
| Medium | Инвестор: интерес спрятан | analytics |
| Low | Организация: путь к партнёрам | manual |

Статусы спринта (UI): `planned` · `in_progress` · `completed` · `rejected`  
(`completed` = `released` в `product_improvements`).

---

## Приоритеты (Impact Score)

Рекомендация:

```text
Impact Score = users × влияние_на_активацию × (6 − сложность)
```

Решение принимает команда. Дашборд показывает ranking на `/admin/product-sprint`.

---

## Исправления

### Первый путь

```text
Главная → Лия → Регистрация → Роль → Онбординг → Первое действие
```

Усилены подсказки, тексты регистрации/онбординга, empty states кабинета.

### Роли

| Роль | Путь |
|---|---|
| Предприниматель | Идея → Проект |
| Эксперт | Профиль → Доверие → Запросы |
| Инвестор | Проекты → Интерес |
| Организация | Потребность → Партнёры |

### Лия

**Lia Improvement Notes** (без смены логики движка):

- понятность вопросов;
- качество первого ответа (подтверждение + шаги + CTA);
- переход к действию;
- границы: только рекомендации.

Сценарий анализа: «Что улучшилось после исправлений?» → `ProductFixImprovementReport`.

---

## Отслеживание результата

События аналитики:

- `product_fix_started` — статус улучшения → `in_progress`
- `product_fix_completed` — статус → `released`
- `activation_after_fix` — первое действие роли после спринта

Сравнение до/после — на дашборде спринта и в `ProductFixSprintReport`.

---

## Отчёты

### ProductFixSprintReport

`summary` · `fixed_issues` · `remaining_issues` · `activation_changes` · `lia_changes` · `recommendations`

### ProductFixImprovementReport (Лия)

`completed` · `improved` · `remaining_problems` · `next_steps`  
Только анализ. Не путать с `ProductImprovementReport` («Что улучшить в ЦКР?»).

---

## Результаты

Смотрите живой срез в `/admin/product-sprint` после применения миграции seed и накопления `activation_after_fix`.

Ожидаемый эффект спринта:

- меньше drop-off после онбординга;
- понятные короткие пути ролей;
- Лия чаще заканчивает ответ CTA;
- empty states ведут к действию.

Оставшиеся Medium/Low закрываются без расширения модулей перед следующей beta-волной.
