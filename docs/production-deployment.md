# Production Deployment — ЦКР

Рекомендуемый поток (без жёсткой привязки к одному провайдеру):

```
GitHub → hosting (Next.js) → production build → domain → SSL
```

Приложение — стандартный Next.js 14 (App Router). Подходит любой host с поддержкой Node.js / Next.js.

---

## Deployment flow

1. **GitHub** — ветка `main` (или release-ветка) с зелёным CI при наличии.
2. **Hosting** — подключить репозиторий, framework preset: Next.js.
3. **Environment Variables** — скопировать из `.env.example`, заполнить production-секреты (см. ниже).
4. **Production build** — host выполняет `npm run build` / `npm run start` (или свой аналог).
5. **Domain** — см. [domain-setup.md](./domain-setup.md).
6. **SSL** — включить на стороне hosting.
7. **Smoke test** — см. [ckr-go-live-manual.md](./ckr-go-live-manual.md).

---

## Обязательные env (минимум)

| Переменная | Назначение |
|------------|------------|
| `NEXT_PUBLIC_SITE_URL` | `https://<REAL_DOMAIN>` |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Только server |

Рекомендуется сразу:

- `LIA_PROVIDER` / `LIA_API_KEY` / `LIA_API_BASE_URL` / `LIA_MODEL`
- контакты компании (`NEXT_PUBLIC_COMPANY_*`)
- `NEXT_PUBLIC_DEMO_MODE=false`
- `ALLOW_DEMO_SEED_IN_PRODUCTION=false`
- `ALLOW_PILOT_SEED_IN_PRODUCTION=false`

Секреты **не** хранить в Git.

---

## Production checklist

- [ ] Build проходит (`npm run build`)
- [ ] `NEXT_PUBLIC_SITE_URL` = HTTPS боевой домен
- [ ] Demo/seed выключены в production
- [ ] Supabase — отдельный production project
- [ ] Migrations применены
- [ ] Auth redirect URLs обновлены
- [ ] Email / SMTP настроен
- [ ] Domain + SSL
- [ ] Smoke: регистрация → login → Лия → создание проекта через UI
- [ ] TINDA **не** загружается seed — создаётся владельцем вручную через UI

Подробный статус: [website-final-checklist.md](./website-final-checklist.md).
