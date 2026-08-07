# Public Launch Checklist — ЦКР

Этап 40: подготовка к Public Launch после **Conditional Go**.  
Версия: `0.40.0-beta` · UI: `/admin/launch` · План волн: [public-launch-plan.md](./public-launch-plan.md)

Новые крупные бизнес-модули **не** входят в scope.

---

## Product

| Пункт | Критерий готовности | Где смотреть |
|---|---|---|
| Критичные проблемы | Critical/high issues закрыты или запланированы с владельцем | `/admin/improvements`, `/admin/launch` |
| Незакрытые задачи | Нет «висящих» blocker-задач без срока | product_improvements + pilot_issues |
| Состояние модулей | Ядро 1.0 стабильно; unused — упрощены или вынесены из первого экрана | `/admin/beta-review` |
| Beta issues | Понятно: исправлено / запланировано / отклонено | `/admin/launch` (buckets) |

---

## Users

| Пункт | Критерий | Где |
|---|---|---|
| Онбординг | Путь регистрация → роль → профиль → первое действие с подсказками | `/register`, `/onboarding`, dashboard hint |
| Приглашения | Волна invites управляется; статусы beta_invites актуальны | `/admin/pilot` |
| Поддержка | Есть help-center и понятный канал оператора | [help-center.md](./help-center.md) |
| LaunchGuide | Лия объясняет роль и первый шаг | `/lia?scenario=launch_guide` |

---

## Technical

| Пункт | Критерий | Команда / место |
|---|---|---|
| Lint | Без ошибок | `npm run lint` |
| Build | Успешная сборка | `npm run build` |
| Environment | Supabase env и секреты настроены для целевого окружения | `.env`, [deployment.md](./deployment.md) |
| Security | RLS, auth gates, production/security checklists просмотрены | [security-audit.md](./security-audit.md), [production-checklist.md](./production-checklist.md) |

---

## Business

| Пункт | Критерий | Где |
|---|---|---|
| Описание продукта | About / features согласованы с фактическим ядром | `/about`, `/features` |
| Сценарии использования | Предприниматель, инвестор, эксперт, организация описаны | [user-flows.md](./user-flows.md), help-center |
| Публичный кейс | ТИНДА оформлен для внешней коммуникации | [tinda-case-public.md](./tinda-case-public.md) |

---

## Launch Analytics

События в `analytics_events` (мониторинг на `/admin/launch`):

| Событие | Смысл |
|---|---|
| `public_registration` | Регистрация на волне public |
| `role_selected` | Выбор роли в онбординге |
| `first_project` | Первый проект пользователя |
| `first_investment_interest` | Первый интерес к инвестициям |
| `first_expert_request` | Первая заявка эксперту |

---

## Вердикт готовности

Считается на `/admin/launch`:

- **ready** — нет блокеров, critical закрыты, technical ok  
- **conditional** — есть attention-пункты, запуск волнами  
- **blocked** — есть critical / env / security блокеры  

После Conditional Go целевой режим волны 1–2: **conditional → ready** по мере закрытия issues.

---

## Перед каждой волной

1. Прогнать lint + build.  
2. Обновить buckets issues на `/admin/launch`.  
3. Проверить онбординг-путь вручную (одна роль).  
4. Прогнать Лию: `launch_guide` + `launch_readiness`.  
5. Зафиксировать решение оператора (Go / Conditional Go / пауза).
