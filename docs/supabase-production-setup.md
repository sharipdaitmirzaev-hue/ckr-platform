# Production Supabase — ЦКР

Используйте **отдельный** production project. Не смешивайте с локальной/dev базой.

## Обязательные env

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` — только сервер (seed/admin scripts). Никогда не в `NEXT_PUBLIC_*`.

---

## Порядок настройки

1. **Создать production project** в Supabase (отдельный от development).
2. **Применить migrations** — см. раздел Migrations ниже.
3. **Проверить RLS** — публичные каталоги читаются анонимно где задумано; запись — только авторизованным владельцам; admin — через роли.
4. **Storage** — бакет `documents` (миграция verification): private, политики RLS, лимит 20 МБ, MIME allowlist на сервере.
5. **Auth** — Email provider включён; Site URL и Redirect URLs = боевой домен (`/auth/callback`).
6. **Redirect URLs** — confirmation, password reset (см. [domain-setup.md](./domain-setup.md)).
7. **Email templates** — брендировать под ЦКР в Auth → Email Templates; SMTP при необходимости ([email-setup.md](./email-setup.md)).
8. **Admin account** — зарегистрировать пользователя и выдать роль `admin` в таблице `user_roles` (вручную в SQL Editor / безопасным скриптом).

---

## Migrations

Файлы: `supabase/migrations/*.sql` (хронологический порядок по имени).

### Рекомендуемый процесс

```bash
# Локально / CI с установленным Supabase CLI и linked production project:
supabase db push

# Или через Dashboard SQL: применять файлы строго по возрастанию timestamp в имени.
```

Не переписывать историю миграций без необходимости. Чистая production database должна подниматься последовательным применением всех файлов из `supabase/migrations/`.

После применения:

- проверить ключевые таблицы: `profiles`, `projects`, `opportunities`, `feedback`, `analytics_events`, `lia_sessions`, `documents`;
- убедиться, что anon может читать опубликованные каталоги;
- убедиться, что insert в `feedback` для contact form работает.

Seed / TINDA seed для обычного go-live **не нужны**.
