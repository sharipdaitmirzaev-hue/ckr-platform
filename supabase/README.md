# Supabase — ЦКР

## Миграции

| Файл | Описание |
|---|---|
| `migrations/20260325120000_profiles_and_roles.sql` | profiles, user_roles, trigger, RLS |
| `migrations/20260325140000_projects_and_categories.sql` | categories, projects, RLS |
| `migrations/20260325150000_opportunities.sql` | opportunity_categories, opportunities, RLS |
| `migrations/20260325160000_applications.sql` | applications, notifications, messages foundation, RLS |
| `migrations/20260325170000_investment_offers.sql` | investment_offers, RLS, helpers заявок |
| `migrations/20260325180000_experts_and_profile_extension.sql` | expert_profiles, profiles trust fields, helpers заявок |
| `migrations/20260325190000_documents_and_verification.sql` | documents, verification_requests, entity statuses, Storage bucket |

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
