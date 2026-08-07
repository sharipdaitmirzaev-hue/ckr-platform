# CKR Website Final Completion + Domain + Production Go-Live (этап 68)

Версия: **0.68.0-beta**.

Кодовая часть публичного сайта завершена. Обычный путь пользователя:

домен → сайт → регистрация → вход → Лия → создание данных через UI.

Seed / Cursor / TINDA seed для обычной работы **не требуются**.

---

## Документы этапа

| Документ | Содержание |
|----------|------------|
| [domain-setup.md](./domain-setup.md) | Домен, DNS, SSL, Auth URLs |
| [production-deployment.md](./production-deployment.md) | Deploy flow + checklist |
| [supabase-production-setup.md](./supabase-production-setup.md) | Prod Supabase + migrations |
| [email-setup.md](./email-setup.md) | Auth email / SMTP |
| [website-final-checklist.md](./website-final-checklist.md) | PASS / NEEDS CONFIGURATION / LEGAL |
| [ckr-go-live-manual.md](./ckr-go-live-manual.md) | Пошагово для владельца |

## Ключевые изменения кода

- `company-details.ts` + env контактов/реквизитов (пустые поля скрыты)
- Legal: `/privacy`, `/terms`, `/personal-data` (черновики)
- Auth: `/auth/callback`, forgot/reset password, `emailRedirectTo` от SITE_URL
- Brand assets placeholders + dynamic OG / icons / manifest
- Lia: user-friendly unavailable вместо тихого mock в production при сбое
- Contact: «Обращение отправлено»; без фиктивного email
- Storage: server MIME/extension validation
- `.env.example` сгруппирован для production

## Следующий шаг (не код)

Вместе с владельцем: домен → hosting → Supabase → secrets → бренд → реквизиты → smoke по реальному URL → ручное создание ТИНДА в UI.
