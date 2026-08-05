# Supabase — ЦКР

## Миграции

| Файл | Описание |
|---|---|
| `migrations/20260325120000_profiles_and_roles.sql` | profiles, user_roles, trigger, RLS |
| `migrations/20260325140000_projects_and_categories.sql` | categories, projects, RLS |

## Как применить

### CLI

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### Dashboard

SQL Editor → вставить содержимое миграции → Run.

## Auth settings

Рекомендации для разработки:

- Email provider: enabled
- Confirm email: можно отключить на время локальной разработки, чтобы сразу получать сессию после `signUp`
