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
| `migrations/20260325200000_admin_panel.sql` | profiles.is_blocked, is_blocked helper |
| `migrations/20260325210000_lia_sessions_and_messages.sql` | lia_sessions, lia_messages, RLS |
| `migrations/20260325290000_beta_launch.sql` | beta_invites, feedback, user_feedback_events, RLS |
| `migrations/20260325300000_crm.sql` | crm_contacts, leads, crm_activities, RLS |
| `migrations/20260325310000_operator_center.sql` | tasks, operator_roles, sla_rules, is_operator, RLS |
| `migrations/20260325320000_partners.sql` | organizations, members, partnerships, organization_id, RLS |
| `migrations/20260325330000_reputation.sql` | reputation_profiles, reviews, entity_history, trust_badges, RLS |
| `migrations/20260325340000_project_lifecycle.sql` | project_status: active, completed |
| `migrations/20260325341000_project_lifecycle_rls.sql` | RLS каталога published/active/completed |

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

## Demo / beta seed

См. [docs/demo-launch.md](../docs/demo-launch.md), [docs/beta-launch.md](../docs/beta-launch.md),
`seed/demo.sql` и `seed/beta-categories.sql`.

```bash
# при запущенном приложении
DEMO_SEED_SECRET=... npm run seed:demo
```

Или `POST /api/demo/seed` с заголовком `x-demo-seed-secret`.  
Требуется `SUPABASE_SERVICE_ROLE_KEY`. Без БД каталоги используют встроенный fallback из `src/lib/demo/seed-data.ts`.
