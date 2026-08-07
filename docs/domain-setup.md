# Настройка домена ЦКР

Не придумывайте домен в коде. Задайте его через окружение:

```bash
NEXT_PUBLIC_SITE_URL=https://<REAL_DOMAIN>
```

Все абсолютные URL (canonical, sitemap, Open Graph, Auth redirects) строятся из этого значения (`src/lib/site/url.ts`).

---

## Пошагово

### 1. Регистрация / использование домена

Зарегистрируйте домен у регистратора или используйте уже купленный. Запишите точное имя (например `example.com`).

### 2. Добавление домена в hosting

В панели хостинга (Vercel / другой Next.js host):

1. Откройте проект ЦКР.
2. Domains → Add.
3. Укажите apex (`example.com`) и при необходимости `www.example.com`.

### 3. DNS records

Хостинг покажет записи. Типично:

| Тип | Имя | Значение |
|-----|-----|----------|
| A / ALIAS | `@` | IP или target хостинга |
| CNAME | `www` | target хостинга |

Точные значения берите только из панели hosting.

### 4. www

Решите канонический вариант:

- основной: `https://example.com`, www → редирект; или
- основной: `https://www.example.com`, apex → редирект.

### 5. Apex domain

Подтвердите apex в hosting и дождитесь зелёного статуса DNS.

### 6. SSL

Хостинг обычно выпускает сертификат автоматически (Let’s Encrypt / аналог). Дождитесь HTTPS без предупреждений браузера.

### 7. Redirect www ↔ main domain

В hosting включите redirect на выбранный канонический хост. В env укажите **тот же** канонический URL в `NEXT_PUBLIC_SITE_URL` (без `/` в конце).

### 8. Проверка DNS

```bash
dig +short example.com
dig +short www.example.com
curl -I https://example.com
```

Ожидается HTTP 200/301/308 и валидный сертификат.

### 9. Обновление Supabase Auth URLs

В Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://<REAL_DOMAIN>`
- **Redirect URLs:**
  - `https://<REAL_DOMAIN>/auth/callback`
  - `https://<REAL_DOMAIN>/auth/callback?next=/onboarding`
  - `https://<REAL_DOMAIN>/auth/callback?next=/reset-password`
  - `https://<REAL_DOMAIN>/**` (если поддерживается wildcard)

Удалите production-ссылки на `localhost`, `*.vercel.app`, `*.local`.

---

## Проверка после настройки

- Открыть сайт по HTTPS
- Canonical / Open Graph без localhost
- `/sitemap.xml` и `/robots.txt` на боевом домене
- Регистрация с email confirmation
- Forgot / reset password
