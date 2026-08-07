# Production checklist ЦКР

Этап 26 (база) + этап 64 (Go-Live). Перед открытием реального трафика.

Живой статус: **`/admin/system-health`** · решение: [go-live.md](./go-live.md).

---

## Код и сборка

- [ ] `npm run lint` — без ошибок
- [ ] `npm run build` — успешно
- [ ] Версия `platformVersion` актуальна (`0.64.0-beta+`)
- [ ] Demo mode выключен (`NEXT_PUBLIC_DEMO_MODE=false`)
- [ ] `DEMO_CATALOG_FALLBACK=false`
- [ ] `ALLOW_DEMO_SEED_IN_PRODUCTION=false`

## Supabase

- [ ] Все миграции применены (включая `system_logs`, lifecycle, `production_launch_decisions`)
- [ ] RLS включён на бизнес-таблицах
- [ ] Storage bucket `documents` + политики
- [ ] Auth: confirm email, redirect URLs только своих доменов
- [ ] Service role key только на сервере

## Безопасность (AccessAudit)

- [ ] Пройден [security-audit.md](./security-audit.md)
- [ ] Admin — полный доступ
- [ ] Staff — CRM / модерация / операции
- [ ] User — только свои данные
- [ ] Organization — только свой контур
- [ ] Сильные `DEMO_SEED_SECRET` / отключён seed
- [ ] Нет публичных утечек provider keys в GET API

## Окружение / Infrastructure

- [ ] `.env` / secrets по [deployment.md](./deployment.md)
- [ ] Hosting + domain + SSL
- [ ] `NEXT_PUBLIC_SITE_URL` = production HTTPS URL
- [ ] LIA_PROVIDER настроен (mock или боевой)
- [ ] PAYMENT_PROVIDER=mock (пока нет боевых платежей)
- [ ] `/admin/system-health` → Services: database, auth, storage, analytics, notifications, Lia

## Product / Business

- [ ] Registration / onboarding
- [ ] Projects / experts / investments / deals / Lia
- [ ] Services / revenue pipeline / CRM

## Backup / RecoveryChecklist

- [ ] План [backup.md](./backup.md) согласован
- [ ] Автобэкапы БД включены
- [ ] Известен runbook восстановления
- [ ] Storage / документы проверены
- [ ] Доступ к `system_logs` для admin/operator проверен

## Smoke после деплоя (ProductionSmokeTest)

- [ ] `/` открывается
- [ ] Предприниматель: регистрация → профиль → Лия → проект
- [ ] Эксперт: регистрация → профиль → верификация
- [ ] Инвестор: регистрация → просмотр проекта → интерес
- [ ] Организация: регистрация → профиль → партнёрство
- [ ] Admin login → `/admin/system-health`
- [ ] Analytics: registration / project / lia / application / deal / revenue events
- [ ] 404 / error pages без утечки stack

## Go-Live Decision

- [ ] Зафиксировано `ProductionLaunchDecision` (`go_live` | `hold` | `rollback`)
- [ ] Указаны комментарий, ответственный, дата
- [ ] План поддержки согласован ([go-live.md](./go-live.md))

## Коммуникации

- [ ] Политика персональных данных / оферта (вне кода)
- [ ] Контакты поддержки для пользователей
