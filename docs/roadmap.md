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

## Этап 11 — Лия: решения и поиск ✅ (код готов)

Подробности: [lia-solutions.md](./lia-solutions.md)

## Этап 12 — Внешний поиск ✅ (код готов)

Подробности: [external-search.md](./external-search.md)

## Этап 13 — Сделки и кабинет проекта ✅ (код готов)

Подробности: [deals-and-workspace.md](./deals-and-workspace.md)

## Этап 14 — Коммуникации и активность ✅ (код готов)

Подробности: [notifications-and-communication.md](./notifications-and-communication.md)

## Этап 15 — Публичная платформа ✅ (код готов)

Подробности: [public-platform.md](./public-platform.md)

- Главная `/` с hero, ролями, каталогами и преимуществами
- `/entrepreneurs`, `/investors`, `/experts`
- Публичные профили `/profile/[id]` + приватность
- SEO: metadata, OpenGraph, sitemap, robots

## Этап 16 — Монетизация ЦКР ✅ (код готов)

Подробности: [monetization.md](./monetization.md)

- `subscription_plans`, `subscriptions`, `services`
- Комиссия в `deals` (fixed / percent)
- `/pricing`, `/services`, `/dashboard/billing`
- `PaymentProvider` (mock: карта, СБП, другие)

## Этап 17 — Аналитика ЦКР ✅ (код готов)

Подробности: [analytics.md](./analytics.md)

- `analytics_events` + RLS
- `/admin/analytics` — пользователи, проекты, инвестиции, сделки, эксперты
- `ProjectAnalytics` в workspace проекта
- Снимок рынка для Лии (без автовыводов)

## Этап 18 — Демонстрационный запуск ✅ (код готов)

Подробности: [demo-launch.md](./demo-launch.md)

- Demo seed (проекты, возможности, инвестиции, эксперты)
- Онбординг с персональным путём по роли
- Demo mode: каталоги без регистрации, скрыты ПДн / документы / переписка
- Empty / Loading / Error states

## Этап 19 — Продуктовое тестирование ✅ (код готов)

Подробности: [product-testing.md](./product-testing.md)

- Сценарии: предприниматель, инвестор, возможность, эксперт, полный цикл
- `/admin/product-tests` — прогоны, задачи, результаты
- Чеклисты, проблемы, рекомендации, статусы

## Этап 20 — Закрытый beta-запуск ✅ (код готов)

Подробности: [beta-launch.md](./beta-launch.md), [changelog.md](./changelog.md)

- `beta_invites` + `/admin/invites`
- `feedback` + FeedbackButton
- `user_feedback_events` после ключевых действий
- Beta badge, seed-категории, документация запуска

## Этап 21 — CRM ЦКР ✅ (код готов)

Подробности: [crm.md](./crm.md)

- `crm_contacts`, `leads`, `crm_activities` + RLS
- `/admin/crm` — контакты, лиды, задачи, история
- Конвертация лида (user / project / opportunity / investment) с подтверждением
- Архитектура Лии для оператора ЦКР

## Этап 22 — Операционный центр ЦКР ✅ (код готов)

Подробности: [operator-center.md](./operator-center.md)

- `/operator` — stats, queue, activity, insights
- `tasks`, `operator_roles`, `sla_rules` + RLS
- Связи задач с lead / project / deal / document / verification
- OperatorInsights: просрочки, зависшие проекты, рекомендации

## Этап 23 — Партнёрская сеть ЦКР ✅ (код готов)

Подробности: [partners.md](./partners.md)

- `organizations`, `organization_members`, `partnerships` + RLS
- `/partner` — профиль, сотрудники, проекты, предложения, заявки
- Связь сущностей через `organization_id`
- Сценарии Лии для организации

## Этап 24 — Репутация и доверие ЦКР ✅ (код готов)

Подробности: [reputation.md](./reputation.md)

- `reputation_profiles`, `reviews`, `entity_history`, `trust_badges` + RLS
- `/profile/[id]` — рейтинг, отзывы, бейджи, история
- Сценарий Лии «Проверь надёжность участника» (факты, без вердикта)

## Этап 25 — Финализация ядра ЦКР ✅ (код готов)

Подробности: [core-audit.md](./core-audit.md), [platform-overview.md](./platform-overview.md)

- Аудит архитектуры, ролей, событий, UX
- Единый жизненный цикл проекта (+ `active` / `completed`)
- Единый обзор `/dashboard`
- Документация ролей и потоков Лии
- Стабилизация перед 1.0 (без новых крупных функций)

## Этап 26 — Подготовка к production ✅ (код готов)

Подробности: [security-audit.md](./security-audit.md), [deployment.md](./deployment.md), [production-checklist.md](./production-checklist.md)

- Аудит RLS / API / actions / middleware
- `system_logs`, единый формат ошибок, серверное логирование
- Документация деплоя и backup
- Performance: лимиты каталогов, индекс, dashboard counts
- Без новых бизнес-модулей

## Этап 27 — Launch readiness / аудит перед 1.0 ✅ (код готов)

Подробности: [launch-readiness.md](./launch-readiness.md)

- Полный пользовательский аудит ролей
- Проверка данных, Лии, доступов
- Отчёт ЦКР 1.0 readiness + план запуска
- Без новых бизнес-функций

## Этап 28 — Closed pilot ✅ (код готов)

Подробности: [launch-readiness.md](./launch-readiness.md)

- Application → Deal (`application_id`, UX «Создать сделку»)
- Интересы инвестора (`investor_interests`, `/dashboard/interests`)
- Роли: operator без полного admin (CRM + модерация)
- Лия: контекст интересов / заявок / сделок
- Без новых крупных модулей

## Этап 29 — Closed pilot tools ✅ (код готов)

Подробности: [closed-pilot.md](./closed-pilot.md)

- `/admin/pilot` — dashboard пилота
- Сбор pilot-метрик воронки
- Feedback ↔ user / page / object
- `pilot_issues` + критерии успеха
- Без новых бизнес-модулей

## Этап 30 — API для мобильного приложения
