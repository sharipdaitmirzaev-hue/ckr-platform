# Руководство Go-Live ЦКР (для владельца)

После этапа 68 **код сайта завершён**. Дальше — ручные действия с реальными аккаунтами. Cursor/seed не нужны для обычной работы пользователя. ТИНДА создаётся вручную через UI.

```
GitHub
  ↓
Production Supabase
  ↓
Environment Variables
  ↓
Deploy
  ↓
Domain
  ↓
DNS
  ↓
SSL
  ↓
Supabase Auth URLs
  ↓
Email
  ↓
Lia provider
  ↓
Smoke test
  ↓
Public site
```

---

## 1. GitHub

Убедитесь, что ветка с этапом 68 влита / доступна для deploy.

## 2. Production Supabase

Создайте отдельный project. Примените migrations (`supabase db push` или SQL по порядку).  
Подробности: [supabase-production-setup.md](./supabase-production-setup.md).

## 3. Environment Variables

В hosting задайте переменные из `.env.example` (группами SITE / SUPABASE / LIA / WEB SEARCH / EMAIL / ANALYTICS / COMPANY).

Обязательно:

- `NEXT_PUBLIC_SITE_URL=https://<REAL_DOMAIN>`
- ключи Supabase
- `NEXT_PUBLIC_DEMO_MODE=false`
- seed flags = false

## 4. Deploy

Подключите репозиторий к hosting, запустите production build.  
См. [production-deployment.md](./production-deployment.md).

## 5–7. Domain / DNS / SSL

См. [domain-setup.md](./domain-setup.md). Дождитесь зелёного HTTPS.

## 8. Supabase Auth URLs

Site URL + Redirect URLs на `/auth/callback` боевого домена.

## 9. Email

Проверьте confirmation и reset password. При необходимости — SMTP.  
См. [email-setup.md](./email-setup.md).

## 10. Lia provider

Задайте `LIA_PROVIDER=openai` (или выбранный), `LIA_API_KEY`, `LIA_API_BASE_URL`, `LIA_MODEL`.  
При сбое ИИ сайт не падает — пользователь видит сообщение «временно недоступна».

## 11. Smoke test

1. Открыть домен ЦКР  
2. Пройти главную и разделы  
3. Зарегистрироваться  
4. Подтвердить email (если включено)  
5. Войти  
6. Онбординг / роль  
7. Открыть Лию, описать задачу  
8. Создать проект через обычный UI  
9. Отправить форму /contacts → «Обращение отправлено»  
10. Проверить forgot password  

**Не** запускать TINDA seed. Создать ТИНДА вручную как обычный пользователь.

## 12. Public site

После smoke test сайт можно показывать предпринимателям, партнёрам и инвесторам.

---

## Что делает владелец вручную

См. итог этапа 68 в PR / ответе агента: домен, DNS, Supabase, secrets, логотип, реквизиты, legal review.
