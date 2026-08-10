# Production checklist ЦКР

Этап 26. Перед открытием реального трафика.

---

## Код и сборка

- [ ] `npm run lint` — без ошибок
- [ ] `npm run build` — успешно
- [ ] Версия `platformVersion` актуальна
- [ ] Demo mode выключен (`NEXT_PUBLIC_DEMO_MODE=false`)
- [ ] `DEMO_CATALOG_FALLBACK=false`
- [ ] `ALLOW_DEMO_SEED_IN_PRODUCTION=false`

## Supabase

- [ ] Все миграции применены (включая `system_logs` и lifecycle)
- [ ] RLS включён на бизнес-таблицах
- [ ] Storage bucket `documents` + политики
- [ ] Auth: confirm email, redirect URLs только своих доменов
- [ ] Service role key только на сервере

## Безопасность

- [ ] Пройден [security-audit.md](./security-audit.md)
- [ ] Сильные `DEMO_SEED_SECRET` / отключён seed
- [ ] Админ-аккаунт создан вручную, не из demo
- [ ] Нет публичных утечек provider keys в GET API

## Окружение

- [ ] `.env` / secrets по [deployment.md](./deployment.md)
- [ ] `NEXT_PUBLIC_SITE_URL` = production URL
- [ ] LIA_PROVIDER настроен (mock или боевой)
- [ ] PAYMENT_PROVIDER=mock (пока нет боевых платежей)

## Backup / ops

- [ ] План [backup.md](./backup.md) согласован
- [ ] Автобэкапы БД включены
- [ ] Известен runbook восстановления
- [ ] Доступ к `system_logs` для admin/operator проверен

## Smoke после деплоя

- [ ] `/` открывается
- [ ] Регистрация / логин
- [ ] `/dashboard` обзор
- [ ] Создание проекта (draft)
- [ ] `/lia` чат (auth)
- [ ] Загрузка документа (свой проект)
- [ ] Admin login → `/admin`
- [ ] 404 / error pages без утечки stack

## Коммуникации

- [x] Политика персональных данных — `/privacy`
- [x] Пользовательское соглашение — `/terms`
- [x] Ссылки в футере и согласие при регистрации
- [ ] Контакты поддержки для пользователей (`support@ckr-center.ru` — настроить почтовый ящик)
