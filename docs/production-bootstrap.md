# Production bootstrap ЦКР (минимум ручных действий)

Цель: на сервере выполнять **1–2 команды**, остальное делает Cursor-скрипт.

Ветка: `cursor/deploy-ubuntu-0.61-ff37` · версия **0.61.0-beta**  
Секреты: только `/etc/ckr/ckr.env` (не в Git, не в скриптах).

---

## Единственная команда — первый запуск

Репозиторий уже в `/var/www/ckr-platform`.

```bash
cd /var/www/ckr-platform && git fetch origin && git checkout cursor/deploy-ubuntu-0.61-ff37 && sudo ./scripts/bootstrap-production.sh
```

### Что сделает скрипт

1. Проверит Ubuntu  
2. Проверит/установит git, curl, nginx, Node.js 22  
3. Создаст пользователя `ckr` и выставит права  
4. Проверит `/etc/ckr/ckr.env` (если нет — создаст шаблон и **остановится**)  
5. Переключится на deploy-ветку  
6. Read-only проверка Supabase migrations (без reset/delete)  
7. `npm ci` + `npm run build`  
8. Установит systemd `ckr` и Nginx  
9. Включит сервис и проверит `/api/health`  
10. Покажет статус / версию / URL сайта  

### Если скрипт остановился из‑за env

```bash
sudo nano /etc/ckr/ckr.env
# заполнить секреты (см. ниже)
cd /var/www/ckr-platform && sudo ./scripts/bootstrap-production.sh
```

Повторный запуск безопасен (идемпотентно).

---

## Единственная команда — обновления

```bash
cd /var/www/ckr-platform && sudo ./scripts/update-production.sh
```

Делает: `fetch` → `checkout`/`pull --ff-only` → `npm ci` → `build` → `restart ckr` → health.

---

## Секреты, которые всё же заполняются вручную

Файл: **`/etc/ckr/ckr.env`**

Обязательно:

- `NEXT_PUBLIC_SITE_URL` — `https://ваш-домен`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — `sb_publishable_...` **или** legacy `anon` JWT  
  (альтернатива: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY` — `sb_secret_...` **или** legacy `service_role` JWT  
  (альтернатива: `SUPABASE_SECRET_KEY`)

Подробнее: [supabase-api-keys.md](./supabase-api-keys.md).

Рекомендуется:

- `LIA_PROVIDER` / `LIA_API_KEY` / `LIA_API_BASE_URL` / `LIA_MODEL`  
  (или временно `LIA_PROVIDER=mock`)

Всегда в production:

- `NEXT_PUBLIC_DEMO_MODE=false`
- `DEMO_CATALOG_FALLBACK=false`
- `ALLOW_DEMO_SEED_IN_PRODUCTION=false`
- `ALLOW_PILOT_SEED_IN_PRODUCTION=false`

Migrations в Supabase — вручную (`supabase db push` / SQL), если health-check таблиц предупредит. Скрипт **не** применяет и **не** сбрасывает БД.

SSL (один раз, когда DNS готов):

```bash
sudo certbot --nginx -d ваш-домен -d www.ваш-домен
```

---

## Файлы

| Файл | Назначение |
|------|------------|
| `scripts/bootstrap-production.sh` | Первый запуск / полное восстановление |
| `scripts/update-production.sh` | Безопасные обновления |
| `scripts/lib/ckr-deploy-common.sh` | Общая логика `[OK]/`[WARN]`/`[ERROR]` |
| `deploy/env/production.env.template` | Шаблон без секретов |
| `docs/deploy-server.md` | Расширенная серверная документация |
