# Beta Review ЦКР

Этап 39: анализ закрытой beta и подготовка решения о Public Launch.  
Версия: `0.39.0-beta` · Связано: [controlled-beta.md](./controlled-beta.md) · [public-launch-plan.md](./public-launch-plan.md) · [tinda-beta-review.md](./tinda-beta-review.md)

Новые крупные бизнес-модули **не добавляются**. Источники: `beta_invites`, `analytics_events`, feedback, pilot_issues, продуктовые таблицы.

---

## Кабинет

`/admin/beta-review`

Блоки:

1. **Пользователи** — приглашено / зарегистрировано / активировано / завершили сценарий  
2. **Роли** — предприниматели, инвесторы, эксперты, организации  
3. **Воронка** — регистрация → … → результат (конверсия, потери, среднее время)  
4. **Модули** — Лия, проекты, возможности, инвестиции, эксперты, CRM, workspace  
5. **PMF-сигналы** — возвраты, повторные действия, результат, топ-сценарии  
6. **BetaReviewReport** и **LaunchReadinessReport**

---

## Воронка

```text
Регистрация
↓
Профиль
↓
Первое использование Лии
↓
Создание объекта
↓
Взаимодействие
↓
Результат
```

---

## Отчёты

### BetaReviewReport

`summary` · `successful_flows` · `blocked_flows` · `unused_features` · `user_problems` · `business_value_signals` · `recommendations`

Лия: сценарий «Сделай обзор закрытой beta» (`beta_review`) — только по данным.

### LaunchReadinessReport

`summary` · `critical_issues` · `recommended_actions` · `launch_risks`

Лия: «Что нужно исправить перед запуском?» (`launch_readiness`) — только анализ.

---

## Решение о запуске

Фиксируется в [public-launch-plan.md](./public-launch-plan.md):

- **Go** — открывать доступ волнами  
- **Conditional Go** — открывать после закрытия списка «Нужно исправить»  
- **No-Go** — продолжить controlled beta / цикл улучшений  

Критерий этапа: принять решение на основе данных, не добавляя новые бизнес-функции.
