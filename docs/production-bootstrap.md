# Production bootstrap ЦКР (минимум ручных действий)

Цель: на сервере выполнять **2 команды**, остальное делает скрипт.

Ветка: `cursor/deploy-ubuntu-0.61-ff37` · версия **0.61.0-beta**  
Секреты: только `/etc/ckr/ckr.env` (не в Git, не в скриптах).

Сначала (один раз, если ветки ещё нет):

```bash
cd /var/www/ckr-platform && git fetch origin && git checkout cursor/deploy-ubuntu-0.61-ff37
```

---

## 1) Настройка env

```bash
cd /var/www/ckr-platform && sudo ./scripts/setup-production-env.sh
```

Спрашивает по очереди SITE_URL, Supabase URL/keys, LIA.  
Секреты вводятся скрыто → пишет `/etc/ckr/ckr.env` (`root:ckr`, `640`) → `[OK] env ready`.

## 2) Deploy

```bash
cd /var/www/ckr-platform && sudo ./scripts/bootstrap-production.sh
```

Проверит env и продолжит: зависимости → build → systemd → nginx → health.

---

## Обновления

```bash
cd /var/www/ckr-platform && sudo ./scripts/update-production.sh
```

---

## Секреты (вводятся в setup)

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — `sb_publishable_...` или legacy anon
- `SUPABASE_SERVICE_ROLE_KEY` — `sb_secret_...` или legacy service_role
- `LIA_PROVIDER` (+ `LIA_API_KEY` / `LIA_API_BASE_URL`, если не mock)

Автоматически: `NEXT_PUBLIC_DEMO_MODE=false`, все seed/demo flags `false`.

Ключи: [supabase-api-keys.md](./supabase-api-keys.md).
