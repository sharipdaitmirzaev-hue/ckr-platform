# Deploy ЦКР 1.0.0 на Ubuntu (Nginx + systemd)

> **Короткий путь:** см. [production-bootstrap.md](./production-bootstrap.md)  
> Первый запуск: `sudo ./scripts/bootstrap-production.sh`  
> Обновления: `sudo ./scripts/update-production.sh`

Инструкция для сервера, где уже есть репозиторий в **`/var/www/ckr-platform`**.  
Скрипт bootstrap сам проверит/установит Node 22, nginx и зависимости.

Секреты **не** хранятся в Git. Demo secrets и тестовые пароли в production **запрещены**.

---

## 1. Версия для деплоя

| Поле | Значение |
|------|----------|
| Версия | **0.61.0-beta** |
| Канал | `project-acquisition` |
| Коммит (базовый) | `e1bedb7978c039c75784254eb82ea8689a0e7f13` |
| Исходная ветка | `cursor/stage-61-project-acquisition-ff37` |
| Deploy-ветка (этот пакет) | `cursor/deploy-ubuntu-0.61-ff37` |

`cursor/deploy-ubuntu-0.61-ff37` = код **0.61.0-beta** + файлы серверного деплоя (systemd, nginx, health, скрипты).

Проверка на сервере после checkout:

```bash
cd /var/www/ckr-platform
git log -1 --oneline
grep version src/config/version.ts
```

Ожидается: `version: "0.61.0-beta"`.

### Можно ли развернуть 0.61.0-beta на этом сервере?

**Да.** Требования совпадают:

- Node.js 20+ (на сервере 22) — OK для Next.js 14.2
- `npm ci --include=dev` + `npm run build` + `npm run start` (runtime: `NODE_ENV=production`)
- Nginx reverse proxy → `127.0.0.1:3000`
- Отдельный production Supabase + 44 migrations (список ниже)

---

## 2. Обязательные переменные окружения

Файл на сервере (вне Git): **`/etc/ckr/ckr.env`**  
Шаблон в репозитории: `deploy/env/production.env.template`

| Переменная | Обязательно | Production-значение |
|------------|-------------|---------------------|
| `NEXT_PUBLIC_SITE_URL` | да | `https://YOUR_DOMAIN` |
| `NEXT_PUBLIC_SUPABASE_URL` | да | URL production project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | да | `sb_publishable_...` или legacy anon JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | да (server) | `sb_secret_...` или legacy service_role JWT |
| `NODE_ENV` | да | `production` |
| `PORT` | да | `3000` |
| `HOSTNAME` | да | `127.0.0.1` |
| `NEXT_PUBLIC_DEMO_MODE` | да | **`false`** |
| `DEMO_CATALOG_FALLBACK` | да | **`false`** |
| `ALLOW_DEMO_SEED_IN_PRODUCTION` | да | **`false`** |
| `ALLOW_PILOT_SEED_IN_PRODUCTION` | да | **`false`** |
| `LIA_PROVIDER` | да | `openai` (или временно `mock`) |
| `LIA_API_KEY` / `LIA_API_BASE_URL` / `LIA_MODEL` | если не mock | реальные ключи |
| `PAYMENT_PROVIDER` | да | `mock` (пока) |

**Не использовать** в production: demo passwords, shared test keys, `NEXT_PUBLIC_DEMO_MODE=true`, включённые seed flags.

---

## 3. Supabase migrations (0.61.0-beta)

Применить **все 44** файла из `supabase/migrations/` по возрастанию имени:

```
20260325120000_profiles_and_roles.sql
20260325140000_projects_and_categories.sql
20260325150000_opportunities.sql
20260325160000_applications.sql
20260325170000_investment_offers.sql
20260325180000_experts_and_profile_extension.sql
20260325190000_documents_and_verification.sql
20260325200000_admin_panel.sql
20260325210000_lia_sessions_and_messages.sql
20260325220000_lia_analyses.sql
20260325230000_deals_milestones_workspace.sql
20260325240000_notifications_activity_messages.sql
20260325250000_public_profiles_privacy.sql
20260325260000_monetization.sql
20260325270000_analytics_events.sql
20260325280000_product_tests.sql
20260325290000_beta_launch.sql
20260325300000_crm.sql
20260325310000_operator_center.sql
20260325320000_partners.sql
20260325330000_reputation.sql
20260325340000_project_lifecycle.sql
20260325341000_project_lifecycle_rls.sql
20260325350000_system_logs_and_security.sql
20260325360000_closed_pilot.sql
20260325370000_closed_pilot_tools.sql
20260325380000_project_execution.sql
20260325390000_project_outcomes.sql
20260325400000_pilot_operations.sql
20260325410000_product_improvements.sql
20260325420000_controlled_beta.sql
20260325430000_wave_launch.sql
20260325440000_launch_goals.sql
20260325450000_closed_wave_tinda.sql
20260325460000_launch_decision_gate.sql
20260325470000_ecosystem_beta_wave2.sql
20260325480000_first_users_wave.sql
20260325490000_product_fix_sprint.sql
20260325500000_beta_expansion_wave.sql
20260325510000_open_beta_wave.sql
20260325520000_public_launch_decision.sql
20260325530000_public_launch_wave.sql
20260325540000_public_launch_operations.sql
20260325550000_growth_engine.sql
```

Команда (если установлен Supabase CLI и project linked):

```bash
supabase db push
```

Или в SQL Editor — по одному файлу сверху вниз. После применения проверить бакет Storage **`documents`** и RLS.

TINDA **не** загружать seed в production — создавать через UI.

---

## 4. Точные команды на сервере (порядок)

Выполняйте от пользователя с `sudo` (например `ubuntu` / `root`).  
Подставьте свой домен вместо `YOUR_DOMAIN` и URL репозитория, если отличается.

### Шаг A — пользователь сервиса и права

```bash
sudo useradd --system --home /var/www/ckr-platform --shell /usr/sbin/nologin ckr || true
sudo chown -R ckr:ckr /var/www/ckr-platform
sudo usermod -aG ckr "$USER"
```

**Ожидается:** пользователь `ckr` существует; каталог принадлежит `ckr:ckr`.

### Шаг B — получить deploy-ветку 0.61.0-beta

```bash
cd /var/www/ckr-platform
git fetch --all --prune
git checkout cursor/deploy-ubuntu-0.61-ff37
git pull --ff-only origin cursor/deploy-ubuntu-0.61-ff37
git log -1 --oneline
grep version src/config/version.ts
```

**Ожидается:**

- `git log` показывает tip ветки deploy-ubuntu-0.61
- в `version.ts`: `"0.61.0-beta"`

Если ветки ещё нет на remote — сначала запушьте её с рабочей машины, либо временно:

```bash
git checkout e1bedb7978c039c75784254eb82ea8689a0e7f13
```

(на чистом `e1bedb7` не будет папки `deploy/` — предпочтительна ветка `cursor/deploy-ubuntu-0.61-ff37`).

### Шаг C — production env (секреты вне Git)

```bash
sudo mkdir -p /etc/ckr
sudo cp /var/www/ckr-platform/deploy/env/production.env.template /etc/ckr/ckr.env
sudo chown root:ckr /etc/ckr/ckr.env
sudo chmod 640 /etc/ckr/ckr.env
sudo nano /etc/ckr/ckr.env
```

Заполните реальные `NEXT_PUBLIC_SITE_URL`, Supabase keys, LIA keys.  
Убедитесь: `NEXT_PUBLIC_DEMO_MODE=false`, seed flags `false`.

**Ожидается:** файл `/etc/ckr/ckr.env` существует, права `640`, в Git его нет.

Проверка обязательных ключей (без печати секретов):

```bash
sudo -u ckr bash -c 'set -a; source /etc/ckr/ckr.env; set +a; for k in NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do if [ -z "${!k}" ] || [[ "${!k}" == REPLACE_* ]] || [[ "${!k}" == YOUR_* ]] || [[ "${!k}" == https://YOUR_* ]]; then echo "MISSING $k"; else echo "OK $k"; fi; done'
```

**Ожидается:** все строки `OK ...`, без `MISSING`.

### Шаг D — зависимости и production build

`/etc/ckr/ckr.env` задаёт `NODE_ENV=production`. При обычном `npm ci` npm
пропускает `devDependencies`, а Next.js build нуждается в `tailwindcss`,
`postcss`, `typescript` и т.п. Поэтому установка всегда с `--include=dev`.
Runtime (`npm start` / systemd) по-прежнему работает с `NODE_ENV=production`.

```bash
cd /var/www/ckr-platform
sudo -u ckr bash -lc 'set -a; source /etc/ckr/ckr.env; set +a; npm ci --include=dev'
sudo -u ckr bash -lc 'set -a; source /etc/ckr/ckr.env; set +a; npm run build'
```

**Ожидается:**

- `npm ci --include=dev` завершается без ошибок, есть `node_modules/tailwindcss`
- `npm run build` → `Compiled successfully`, папка `.next`

### Шаг E — systemd (постоянный сервис)

```bash
sudo cp /var/www/ckr-platform/deploy/systemd/ckr.service /etc/systemd/system/ckr.service
sudo systemctl daemon-reload
sudo systemctl enable ckr
sudo systemctl restart ckr
sudo systemctl status ckr --no-pager
```

**Ожидается:** `Active: active (running)`.

Логи:

```bash
sudo journalctl -u ckr -n 50 --no-pager
```

**Ожидается:** Next.js слушает `127.0.0.1:3000` (Ready).

### Шаг F — локальный health check

```bash
curl -sS http://127.0.0.1:3000/api/health
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
```

**Ожидается:** JSON вида:

```json
{"ok":true,"service":"ckr-platform","version":"0.61.0-beta", ...}
```

и HTTP код главной `200` (или `307/308` на auth — допустимо, главное не `502`).

### Шаг G — Nginx reverse proxy

```bash
sudo cp /var/www/ckr-platform/deploy/nginx/ckr.conf /etc/nginx/sites-available/ckr
sudo sed -i 's/YOUR_DOMAIN/example.com/g' /etc/nginx/sites-available/ckr
# ↑ замените example.com на ваш домен
sudo ln -sf /etc/nginx/sites-available/ckr /etc/nginx/sites-enabled/ckr
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

**Ожидается:** `nginx: configuration file ... syntax is ok` / `test is successful`.

Проверка через Nginx:

```bash
curl -sS -H "Host: YOUR_DOMAIN" http://127.0.0.1/api/health
```

### Шаг H — SSL (когда домен указывает на сервер)

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```

**Ожидается:** HTTPS открывается без предупреждения; `NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN`.

Не забудьте обновить Supabase Auth → Site URL / Redirect URLs на этот домен (`/auth/callback` если есть в вашей версии; для 0.61 проверьте фактические auth redirects в приложении).

---

## 5. Безопасное обновление

Скрипт: `scripts/server-deploy.sh`

```bash
cd /var/www/ckr-platform
chmod +x scripts/server-deploy.sh scripts/server-healthcheck.sh
./scripts/server-deploy.sh cursor/deploy-ubuntu-0.61-ff37
```

Порядок внутри скрипта:

1. `git fetch`
2. checkout целевой ref
3. показать revision / version
4. `npm ci --include=dev` (build-time deps при `NODE_ENV=production`)
5. `npm run build` (с `/etc/ckr/ckr.env`)
6. `systemctl restart ckr` + health check

Откат на базовый коммит 0.61:

```bash
./scripts/server-deploy.sh e1bedb7978c039c75784254eb82ea8689a0e7f13
```

(на чистом SHA не будет новых deploy-файлов — unit/nginx уже установлены в `/etc`).

---

## 6. Как проверить, что ЦКР запущен

```bash
# 1) сервис
systemctl is-active ckr
# ожидается: active

# 2) процесс слушает localhost:3000
ss -ltnp | grep 3000 || sudo ss -ltnp | grep 3000
# ожидается: 127.0.0.1:3000

# 3) health
curl -sS http://127.0.0.1:3000/api/health
# ожидается: "ok":true, "version":"0.61.0-beta"

# 4) через Nginx / домен
curl -sS https://YOUR_DOMAIN/api/health
curl -sS -o /dev/null -w "%{http_code}\n" https://YOUR_DOMAIN/

# 5) скрипт
CKR_PUBLIC_URL=https://YOUR_DOMAIN/api/health ./scripts/server-healthcheck.sh
```

Smoke вручную в браузере: `/` → `/login` → регистрация → `/lia` → кабинет.

---

## 7. Файлы в репозитории

| Путь | Назначение |
|------|------------|
| `deploy/env/production.env.template` | Шаблон env (без секретов) |
| `deploy/systemd/ckr.service` | systemd unit |
| `deploy/nginx/ckr.conf` | Nginx site |
| `scripts/server-deploy.sh` | git → ci → build → restart |
| `scripts/server-healthcheck.sh` | проверка сервиса |
| `src/app/api/health/route.ts` | `GET /api/health` |
| `docs/deploy-server.md` | эта инструкция |

---

## 8. Чего не делать

- Не коммитить `/etc/ckr/ckr.env` и `.env.production*`
- Не включать `ALLOW_*_SEED_IN_PRODUCTION=true`
- Не оставлять `NEXT_PUBLIC_DEMO_MODE=true`
- Не слушать Next.js на `0.0.0.0` публично без Nginx/firewall
- Не применять seed TINDA для «заполнения» production
