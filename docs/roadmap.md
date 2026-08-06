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

## Этап 30 — Пилот ООО ТИНДА ✅ (код готов)

Подробности: [tinda-pilot.md](./tinda-pilot.md)

- Организация и проект оптовой платформы
- Анализ Лии, workspace-этапы, CRM-сегменты, сделка
- Seed `npm run seed:tinda` + отчёт пилота
- Без новых бизнес-модулей

## Этап 31 — Улучшения по пилоту ТИНДА ✅ (код готов)

Подробности: [tinda-case-study.md](./tinda-case-study.md), [tinda-improvements.md](./tinda-improvements.md)

- Case study пилота
- Шаблон `business_development`
- Лия: «Аудит бизнеса» + `BusinessAuditReport`
- CRM-шаблоны customers / suppliers / partners
- Без новых крупных модулей

## Этап 32 — Методология ЦКР ✅ (код готов)

Подробности: [ckr-methodology.md](./ckr-methodology.md)

- Шаблоны проектов (4 типа): цели, этапы, необходимые данные, рекомендуемые действия
- Методология сопровождения: диагностика → … → контроль результата
- Лия: «Разработать стратегию развития» → `StrategyReport`
- Структуры документов проекта (без файлов): BusinessPlan / Roadmap / InvestmentProposal
- Применение к пилоту ТИНДА
- Без новых крупных модулей

## Этап 33 — Project Execution ✅ (код готов)

Подробности: [project-execution.md](./project-execution.md)

- `project_roadmaps` / `roadmap_items` / `project_metrics`
- Связь с `tasks` и `project_milestones`
- `ProjectProgress` в workspace
- Лия: «Проверь прогресс проекта» → `ProgressReport`
- Применение к пилоту ТИНДА
- Без новых типов участников и крупных модулей

## Этап 34 — Project Outcomes ✅ (код готов)

Подробности: [project-outcomes.md](./project-outcomes.md)

- `project_results` / `project_financial_metrics`
- Связь с KPI, панель `/admin/results`
- Метрики эффективности ЦКР
- Лия: «Оцени результат проекта» → `OutcomeReport`
- Применение к пилоту ТИНДА
- Без новых крупных модулей

## Этап 35 — Упаковка ЦКР 1.0 ✅ (код готов)

Подробности: [ckr-1.0-overview.md](./ckr-1.0-overview.md)

- Аудит пользовательских путей
- UX-полировка ключевых страниц
- `/about`, `/features`
- Demo-сценарий и roadmap после 1.0
- Без новых крупных модулей и сущностей БД

Дальнейшее развитие (не в 1.0): [roadmap-after-1.0.md](./roadmap-after-1.0.md)

## Этап 36 — Pilot Operations ✅ (код готов)

Подробности: [pilot-operations.md](./pilot-operations.md)

- Управление участниками пилота (`pilot_participants`) и чеклистами
- Расширение `/admin/pilot` и отчёт `/admin/pilot/report`
- Feedback: категории + приоритет
- Лия: `PilotInsightReport` («Что мешает проекту двигаться?»)
- Контроль прогресса ТИНДА
- Без новых крупных бизнес-модулей

## Этап 37 — Product Improvement Loop ✅ (код готов)

Подробности: [product-improvement-loop.md](./product-improvement-loop.md)

- Центр улучшений `/admin/improvements`
- `product_improvements` + цепочка feedback → pilot_issues → улучшения
- Лия: `ProductImprovementReport` («Что улучшить в ЦКР?»)
- Обзор пилота ТИНДА: `tinda-pilot-review.md`
- Без новых крупных бизнес-модулей

## Этап 38 — Controlled Beta ✅ (код готов)

Подробности: [controlled-beta.md](./controlled-beta.md)

- Управление доступом `beta_invites` (invited/activated/completed/disabled)
- Beta Participants + `/admin/beta-report`
- Онбординг-метрики и чеклисты сценариев ролей
- Лия: `BetaAnalysisReport`
- ТИНДА как beta case
- Без новых крупных бизнес-модулей

## Этап 39 — Beta Review ✅ (код готов)

Подробности: [beta-review.md](./beta-review.md)

- `/admin/beta-review`: воронка, роли, модули, PMF
- `BetaReviewReport` / `LaunchReadinessReport`
- План public launch и обзор ТИНДА
- Без новых крупных бизнес-модулей

## Этап 40 — Public Launch prep ✅ (код готов)

Подробности: [public-launch-checklist.md](./public-launch-checklist.md)

- `/admin/launch`: Product / Users / Technical / Business + buckets issues
- Онбординг-подсказки и launch analytics
- Лия: `LaunchGuide` («Как начать работу с ЦКР?»)
- Help center, публичный кейс ТИНДА
- Без новых крупных бизнес-модулей

## Этап 41 — Wave Launch ✅ (код готов)

Подробности: [wave-launch.md](./wave-launch.md)

- `launch_waves` / `launch_wave_participants`
- Launch Dashboard: волна, участники, LaunchReport, проблемы, результаты
- Лия: `LaunchStatusReport` («Как проходит запуск?»)
- ТИНДА → production pilot case
- Без новых крупных бизнес-модулей

## Этап 42 — Launch Success Framework ✅ (код готов)

Подробности: [launch-success-framework.md](./launch-success-framework.md)

- `launch_goals` + ProgressBar на `/admin/launch`
- LaunchMetrics (users / activation / business)
- Лия: `LaunchGoalReport` («Достигнуты ли цели запуска?»)
- События целей → analytics / activity_feed / notifications
- Без новых крупных бизнес-модулей

## Этап 43 — Closed Wave 1 — ТИНДА ✅ (код готов)

Подробности: [closed-wave-tinda-report.md](./closed-wave-tinda-report.md)

- Конфигурация волны и целей под ООО ТИНДА
- Проверка пути org → project → lia → roadmap → CRM → deals
- Лия: `ClosedWaveReport` («Проанализируй первую волну ЦКР»)
- Без новых крупных бизнес-модулей

## Этап 44 — Closed Wave Review ✅ (код готов)

Подробности: [closed-wave-review.md](./closed-wave-review.md)

- `/admin/wave-review`: цели, UX, активность, Next Wave Decision
- `ClosedWaveReviewReport` + improvement loop из проблем волны
- Лия: `WaveReviewReport` («Проанализируй результаты первой волны»)
- Без новых крупных бизнес-модулей

## Этап 45 — Launch Decision Gate ✅ (код готов)

Подробности: [launch-decision-gate.md](./launch-decision-gate.md)

- `/admin/launch-decision`: LaunchDecisionReport, triage Critical→Low, решение
- Подготовка Launch Wave 2 (closed/beta) + цели экосистемы
- Лия: `LaunchDecisionAIReport` («Готов ли ЦКР к следующей волне?»)
- Без новых крупных бизнес-модулей

## Этап 46 — Wave 2 Ecosystem Beta ✅ (код готов)

Подробности: [ecosystem-beta.md](./ecosystem-beta.md)

- Волна «Wave 2 — Ecosystem Beta» + цели когорт / активации / связей
- `/admin/ecosystem-report`: связи ролей, метрики, сценарии, ТИНДА check
- Лия: `EcosystemReport` («Как развивается экосистема ЦКР?»)
- Без новых крупных бизнес-модулей

## Этап 47 — Ecosystem Value ✅ (код готов)

Подробности: [ecosystem-value.md](./ecosystem-value.md)

- `EcosystemMatchingMetrics` + `MatchQualityScore`
- `/admin/ecosystem-value`: ценность связей, MatchingChart, ConnectionTable
- Лия: `EcosystemValueReport` («Какая польза от экосистемы ЦКР?»)
- Без новых крупных бизнес-модулей

## Этап 48 — Public Marketplace ✅ (код готов)

Подробности: [public-marketplace.md](./public-marketplace.md)

- Публичная главная и каталоги с фильтрами
- Ролевые страницы, how-it-works, cases (ТИНДА), публичная Лия
- SEO: metadata / OG / sitemap / robots
- Без новых крупных бизнес-сущностей

## Этап 49 — First Users Launch ✅ (код готов)

Подробности: [first-users-launch.md](./first-users-launch.md)

- `/trust`, расширенный `/cases` (ТИНДА)
- Первый путь роли + подсказки «Что хотите сделать?» → Лия
- Демо-метки seed, проверка модерации, аналитика воронки
- Без новых крупных бизнес-модулей

## Этап 50 — First Users Wave ✅ (код готов)

Подробности: [first-users-wave.md](./first-users-wave.md)

- Launch Wave «First Users Wave» (closed, active)
- Приглашения: роль, источник, статусы invited→…→completed
- `/admin/first-users`, feedback loop, аналитика поведения
- Лия: FirstUsersReport («Как прошёл первый запуск ЦКР?»)
- Без массового запуска и новых крупных модулей

## Этап 51 — First Users Review ✅ (код готов)

Подробности: [first-users-review.md](./first-users-review.md)

- `/admin/first-users-review`: воронка, роли, Лия, issues, ТИНДА
- FirstUsersDecision + FirstUsersReviewReport / FirstUsersLiaReport
- Лия: «Что показал первый запуск ЦКР?»
- Без новых крупных бизнес-модулей

## Этап 52 — Product Fix Sprint ✅ (код готов)

Подробности: [product-fix-sprint.md](./product-fix-sprint.md)

- `/admin/product-sprint`: Critical/High проблемы, Impact Score, отчёты
- UX первого пути и путей ролей; Lia Improvement Notes
- Аналитика фиксов и активации после исправлений
- Лия: «Что улучшилось после исправлений?»
- Без новых крупных бизнес-модулей

## Этап 53 — Beta Expansion Wave ✅ (код готов)

Подробности: [beta-expansion.md](./beta-expansion.md)

- Launch Wave «Beta Expansion Wave» (`beta`, `active`)
- `/admin/beta-expansion`: когорта, активация, экосистема, сравнение с First Users
- BetaExpansionDecision + BetaExpansionReport
- Лия: «Как проходит расширенная beta?»
- Без новых крупных бизнес-модулей

## Этап 54 — Open Beta Readiness ✅ (код готов)

Подробности: [open-beta-readiness.md](./open-beta-readiness.md) · [open-beta-launch-plan.md](./open-beta-launch-plan.md)

- `/admin/open-beta-review`: Product / User / Ecosystem / Technical / Business
- OpenBetaDecision + OpenBetaReadinessReport
- Лия: «Готов ли ЦКР к открытому запуску?»
- Без новых крупных бизнес-модулей

## Этап 55 — Open Beta Launch Control ✅ (код готов)

Подробности: [open-beta-launch-control.md](./open-beta-launch-control.md) · [open-beta-first-30-days.md](./open-beta-first-30-days.md)

- Launch Wave «Open Beta Wave 1» (`public`, `active`)
- `/admin/open-beta`: доступ, воронка, метрики, health, feedback categories
- OpenBetaReport + OpenBetaHealthCheck
- Лия: «Как проходит открытый запуск ЦКР?»
- Без новых бизнес-направлений

## Этап 56 — Open Beta Growth ✅ (код готов)

Подробности: [open-beta-growth.md](./open-beta-growth.md)

- `/admin/open-beta-growth`: рост, retention D1/D7/D14/D30, ценные действия, роли
- GrowthEcosystemMetrics + UserValueFeedbackReport
- OpenBetaGrowthDecision + RetentionReport
- Лия: «Почему пользователи возвращаются в ЦКР?»
- Без новых крупных бизнес-модулей

## Этап 57+ — backlog

В т.ч. API для мобильного приложения — см. roadmap-after-1.0.
