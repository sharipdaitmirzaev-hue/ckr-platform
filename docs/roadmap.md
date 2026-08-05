# Roadmap ЦКР

## Этап 0 — Foundation ✅

- Next.js + TypeScript + Tailwind
- Дизайн-система и фирменный стиль
- Структура папок и маршрутов MVP
- Компоненты: Header, Footer, Logo, карточки каталогов, LiaWidget
- Типы: User, Project, Opportunity, Solution, Investment
- Главная, каталоги, auth shells, `/dashboard`, Лия placeholder

## Этап 1 — Supabase Auth + Profiles + Roles ✅ (код готов)

Подробности: [auth.md](./auth.md)

## Этап 2 — Проекты ✅ (код готов)

Подробности: [projects.md](./projects.md)

- Таблицы `categories` + `projects`
- RLS, публичный каталог, страница проекта
- CRUD владельца: `/dashboard/projects`, create, edit
- `ProjectCard` в стиле ЦКР

## Этап 3 — Возможности ✅ (код готов)

Подробности: [opportunities.md](./opportunities.md)

- Таблицы `opportunity_categories` + `opportunities`
- RLS, публичный каталог, страница `/opportunity/[id]`
- CRUD владельца в dashboard
- `OpportunityCard` в стиле ЦКР

## Этап 4 — Заявки и взаимодействия ✅ (код готов)

Подробности: [applications.md](./applications.md)

- Универсальная таблица `applications`
- Уведомления + foundation `conversations` / `messages`
- Dashboard: входящие / исходящие
- CTA на проекте и возможности

## Этап 4b — Решения (следующий)

- Комплексные предложения
- Связка заявок с модулем решений

## Этап 5 — Инвестиции ✅ (код готов)

Подробности: [investments.md](./investments.md)

- `investment_offers` + RLS
- Каталог `/investments` с фильтрами
- Связь с проектами и `applications`
- Dashboard CRUD инвестора

## Этап 6 — Эксперты и расширенные профили ✅ (код готов)

Подробности: [experts.md](./experts.md)

- `expert_profiles` + расширение `profiles` (website, social_links, verification_status)
- Каталог `/experts`, карточка `/expert/[id]`
- Dashboard: профиль эксперта, create/edit
- Блок «Нужен эксперт» на проекте + заявки `target_type = expert`

## Этап 7 — Документы и верификация ✅ (код готов)

Подробности: [verification.md](./verification.md)

- Таблицы `documents` + `verification_requests`
- `verification_status` на projects / opportunities / investment_offers / expert_profiles
- Storage bucket `documents` + RLS
- `/dashboard/documents`, `/admin/verifications`
- Компоненты `VerificationBadge`, `DocumentList`, `UploadDocumentForm`

## Этап 7b — Сообщения и избранное

## Этап 8 — Админ-панель ✅ (код готов)

Подробности: [admin.md](./admin.md)

- `/admin/dashboard`, users, projects, opportunities, investments, experts, verifications
- Компоненты AdminSidebar / AdminHeader / StatsCard / AdminTable / StatusBadge
- `profiles.is_blocked`, middleware + `requireAdmin`, RLS через `is_admin`

## Этап 9 — Лия (навигатор) ✅ (код готов)

Подробности: [lia.md](./lia.md)

- `/lia` + плавающий `LiaWidget`
- `lia_sessions` / `lia_messages` + RLS
- `/api/lia` + `provider.ts` (mock / openai-compatible)
- Поиск по проектам, возможностям, инвестициям, экспертам
- Сценарий бизнес-идеи → черновик проекта; `SolutionDraft`

## Этап 10 — От идеи до проекта ✅ (код готов)

Подробности: [project-flow.md](./project-flow.md)

- Сценарий Лии «Помоги создать бизнес-проект»
- `ProjectDraft` + preview / wizard / create
- Создание `projects` только после подтверждения → `/dashboard/projects/[id]/edit`

## Этап 11 — API для мобильного приложения
