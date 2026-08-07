# Controlled Beta ЦКР

Этап 38: ограниченный запуск на реальных пользователях.  
Версия: `0.38.0-beta` · Связано: [pilot-operations.md](./pilot-operations.md) · [beta-launch.md](./beta-launch.md) · [tinda-beta-report.md](./tinda-beta-report.md)

Новые крупные бизнес-модули **не добавляются**. Цель — проверить готовую платформу.

---

## Цели beta

1. Проверить доступ по приглашениям end-to-end.  
2. Пройти онбординг и ключевые сценарии ролей.  
3. Собрать метрики активации и первых действий.  
4. Найти блокеры UX/операций до public launch.  
5. Убедиться, что ТИНДА работает как живой beta case.

---

## Участники и доступ

Система: `beta_invites` (`NEXT_PUBLIC_BETA_REQUIRE_INVITE=true`).

| Статус | Смысл |
|---|---|
| `invited` | Приглашён (код активен) |
| `activated` | Зарегистрировался по коду |
| `completed` | Завершил целевой сценарий роли |
| `disabled` | Доступ отключён |

Legacy (`created` / `sent` / `used` / `expired`) читаются как invited / activated / disabled.

Кабинеты: `/admin/invites` · `/admin/pilot` (Beta Participants) · `/admin/beta-report`.

---

## Сценарии

### Предприниматель

Регистрация → Профиль → Лия → Создание проекта → Анализ → Публикация

### Инвестор

Регистрация → Профиль → Поиск проекта → Интерес

### Эксперт

Профиль → Верификация → Получение запроса

### Организация

Профиль → Сотрудники → Проект

Чеклисты и счётчики шагов: `/admin/beta-report`.

---

## Метрики успеха

### Онбординг-события (`analytics_events`)

- `onboarding_started`
- `onboarding_completed`
- `profile_completed`
- `first_lia_use`
- `first_project_created`
- `first_application_sent`
- `first_interest_created`

### Воронка Beta Report

```text
Регистрация → Профиль → Первое действие → Лия → Создание объекта
```

### Активность

Проекты · заявки · интересы · сделки

### Ориентиры

| Метрика | Ориентир |
|---|---|
| Активация (activated / invited+activated) | ≥ 60% |
| Профиль после регистрации | ≥ 70% |
| Первое действие после профиля | ≥ 50% |
| Critical issues без улучшения | 0 к концу волны |
| Feedback на участника | ≥ 1 |

---

## Лия

Сценарий: **«Как проходит запуск ЦКР?»** → `BetaAnalysisReport`

- `summary`
- `activation_rate`
- `blocked_users`
- `unused_features`
- `recommendations`

Только анализ.

---

## Критерии перехода к public launch

1. Целевые сценарии ролей пройдены когортой без критических блокеров.  
2. Активация и воронка в пределах ориентиров (или объяснены и закрыты улучшениями).  
3. Цикл улучшений работает: feedback → issues → `product_improvements` → `released`.  
4. ТИНДА как beta case: проект / roadmap / KPI / результаты актуальны.  
5. Нет открытых `critical` pilot_issues.  
6. Документация запуска и отчёт ТИНДА обновлены.

После выполнения — готовность к расширению доступа (не к новым бизнес-направлениям).
