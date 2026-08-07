# Email setup — ЦКР

Собственный mail server не создаём. Письма Auth идут через **Supabase Auth**.

## Нужные письма

| Письмо | Источник |
|--------|----------|
| Подтверждение регистрации | Supabase Auth (Confirm signup) |
| Восстановление пароля | Supabase Auth (Reset password) |
| Системные уведомления платформы | Если уже реализованы в продукте — через существующие каналы |

Redirect после писем: `https://<REAL_DOMAIN>/auth/callback?...`  
См. [domain-setup.md](./domain-setup.md).

---

## SMTP / внешний провайдер

Если встроенный email Supabase недостаточен для production:

1. Зарегистрируйте SMTP-провайдер (Resend, Postmark, SendGrid, Amazon SES и т.п.).
2. В Supabase Dashboard → Project Settings → Auth → SMTP Settings укажите:
   - host, port, user, password
   - sender email / name (например «ЦКР»)
3. Credentials храните **только** в Supabase / secret store hosting.
4. **Не** коммитьте SMTP-пароли в `.env` репозитория.

Проверка:

1. Регистрация нового пользователя → письмо confirmation.
2. Forgot password → письмо reset.
3. Ссылки ведут на боевой домен, не на localhost.
