# Open Beta Launch Control

Этап 55 · Версия `0.55.0-beta`  
UI: `/admin/open-beta` · Лия: «Как проходит открытый запуск ЦКР?»

Связано: [open-beta-growth.md](./open-beta-growth.md) · [open-beta-readiness.md](./open-beta-readiness.md) · [open-beta-first-30-days.md](./open-beta-first-30-days.md) · [open-beta-launch-plan.md](./open-beta-launch-plan.md)

---

## Цель

Управляемый публичный запуск уже созданной платформы ЦКР: контролируемый доступ, мониторинг, feedback, анализ — **без новых бизнес-направлений**.

Волна: **Open Beta Wave 1** · тип `public` · статус `active`  
Источник приглашений: `open_beta_wave`

---

## Правила запуска

1. Доступ только по `beta_invites` (invite-only).
2. У каждого приглашения: **источник**, **канал привлечения**, **статус прохождения**.
3. Статусы: `invited` → `registered` → `activated` → `active` → `completed` | `inactive`.
4. Critical issues = 0 в проде; High в работе.
5. Не открывать анонимный массовый signup без мониторинга.
6. Feedback loop обязателен: User → Feedback → Issue → Improvement.

---

## Метрики (OpenBetaMetrics)

- новые / активные пользователи;
- созданные и опубликованные проекты;
- заявки, интересы, экспертные взаимодействия, сделки;
- использование Лии;
- feedback по категориям: UX · Lia · Project · Expert · Investment · Other.

Путь: Вход → Регистрация → Роль → Профиль → Лия → Первое действие → Результат (с потерями).

---

## Контроль

| Инструмент | Назначение |
|---|---|
| `/admin/open-beta` | Операционный дашборд волны |
| `OpenBetaHealthCheck` | Ошибки, Critical, активность, нагрузка, env |
| `/admin/improvements` | Feedback → issues → improvements |
| Лия `open_beta` | Аналитический срез (только анализ) |

---

## Критерии успеха

- Critical = 0  
- Регистрация ≥ 60% от приглашённых  
- Первое действие ≥ 25%  
- Лия ≥ 35%  
- Есть связи (интересы / заявки / взаимодействия)  
- Feedback loop работает  

См. также план первых 30 дней.
