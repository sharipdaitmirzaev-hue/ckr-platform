# Changelog ЦКР

Версия платформы отражается в интерфейсе бейджем **Beta**.

---

## 0.62.0-beta — 2026-08-06

Partnership Network — развитие партнёрской сети на базе organizations / partnerships.

### Изменения

- Дашборд `/admin/partnerships`: партнёры, типы, pipeline, outcomes, attribution, задачи
- `PartnershipPipeline` + `partnership_tasks` (миграция `20260325560000_partnership_network.sql`)
- Лия: «Как развивается партнёрская сеть ЦКР?» → `PartnershipReport`
- Analytics: `partner_created`, `partner_contacted`, `partner_activated`, `partner_referral_created`, `partner_result_created`
- Документация: `partnership-network.md`, `initial-partner-strategy.md`

---

## 0.61.0-beta — 2026-08-06

Project Acquisition Engine — поток бизнес-проектов от поиска до развития (без нового каталога).

### Изменения

- Дашборд `/admin/project-acquisition`: воронка, источники, качество, путь development
- `ProjectAcquisitionPipeline` (CRM leads ↔ stages) · `ProjectSources` · `ProjectQualityScore`
- Лия: «Аудит моего бизнеса» предлагает проект после подтверждения; «Как развивается поток проектов ЦКР?» → `ProjectAcquisitionReport`
- Analytics: `project_lead_created`, `project_contacted`, `project_interest_confirmed`, `project_draft_created`, `project_published_from_acquisition`
- Документация: `project-acquisition-engine.md`, `tinda-project-acquisition-case.md`

---

## 0.60.0-beta — 2026-08-06

Growth Engine — управляемый рост после Public Launch (без новых крупных бизнес-модулей).

### Изменения

- Дашборды `/admin/growth` и `/admin/growth-kpi`
- GrowthChannels, ProjectGrowthPipeline (CRM), ExpertGrowthPipeline, PartnerGrowthTracking
- GrowthTasks (`growth_tasks`) + операционные типы роста
- Лия: «Как растёт ЦКР?» → `GrowthReport`
- Документация: `growth-engine.md`

---

## 0.59.0-beta — 2026-08-06

Public Launch Operations — активация волны и операционное управление (без новых крупных бизнес-модулей).

### Изменения

- Активация Public Launch Wave 1: дата, ответственный, комментарий, событие `public_launch_activated`
- `/admin/public-launch-operations`: daily metrics, health, задачи, сценарии ролей
- `LaunchOperationsTasks`, `LaunchHealthMonitor`, источник improvements `public_launch`
- Лия: «Как проходит запуск ЦКР сейчас?» → `LiveLaunchReport`
- Документация: `public-launch-operations.md`

---

## 0.58.0-beta — 2026-08-06

Public Launch Execution — управление публичным запуском после Decision Gate (без новых крупных бизнес-модулей).

### Изменения

- Launch Wave «Public Launch Wave 1» (`public`, `planned` → `active` только при `public_launch`)
- Дашборды `/admin/public-launch` и `/admin/public-launch-kpi`
- `PublicLaunch90Days`, `LaunchChannels`, feedback категория `public_launch`
- Лия: «Как проходит публичный запуск ЦКР?» → `PublicLaunchReport`
- Документация: `public-launch-execution.md`

---

## 0.57.0-beta — 2026-08-06

Public Launch Decision Gate — управленческое решение о выходе ЦКР из beta (без новых крупных бизнес-модулей).

### Изменения

- Дашборд `/admin/public-launch-decision`: Product / User / Ecosystem / Business / Risks
- `BusinessLaunchReadiness`, `LaunchRiskReview`, `PublicLaunchDecision`
- Фиксация решения в `public_launch_decisions` (решение, комментарий, ответственный, дата)
- Лия: «Готов ли ЦКР к публичному запуску?» → `PublicLaunchDecisionReport`
- Документация: `public-launch-decision.md`, `public-beta-launch-plan.md`

---

## 0.56.0-beta — 2026-08-06

Open Beta Growth — анализ роста и удержания после Open Beta (без новых крупных бизнес-модулей).

### Изменения

- Дашборд `/admin/open-beta-growth`: рост, RetentionMetrics (D1/D7/D14/D30), ценность действий
- `RoleGrowthReport`, `GrowthEcosystemMetrics`, `UserValueFeedbackReport`
- `OpenBetaGrowthDecision`: scale_public / continue_growth / improve_retention
- Лия: «Почему пользователи возвращаются в ЦКР?» → `RetentionReport`
- Документация: `open-beta-growth.md`

---

## 0.55.0-beta — 2026-08-06

Open Beta Wave 1 — контролируемый публичный запуск с мониторингом (без новых бизнес-направлений).

### Изменения

- Launch Wave «Open Beta Wave 1» (`public`, `active`) + цели
- `beta_invites`: канал привлечения, статусы registered/inactive
- Дашборд `/admin/open-beta`: пользователи, роли, воронка, OpenBetaMetrics, HealthCheck
- Feedback категории: UX / Lia / Project / Expert / Investment / Other
- Лия: «Как проходит открытый запуск ЦКР?» → `OpenBetaReport`
- Документация: `open-beta-launch-control.md`, `open-beta-first-30-days.md`

---

## 0.54.0-beta — 2026-08-06

Open Beta Readiness — проверка готовности ЦКР к открытому запуску (без новых крупных модулей).

### Изменения

- Дашборд `/admin/open-beta-review`: Product / User / Ecosystem / Technical / Business
- `TechnicalChecklist` + `BusinessReadiness`
- `OpenBetaDecision`: open_beta / continue_beta / needs_improvement
- Лия: «Готов ли ЦКР к открытому запуску?» → `OpenBetaReadinessReport`
- Документация: `open-beta-readiness.md`, `open-beta-launch-plan.md`

---

## 0.53.0-beta — 2026-08-06

Beta Expansion Wave — расширенная закрытая beta после Product Fix Sprint (без новых крупных модулей).

### Изменения

- Launch Wave «Beta Expansion Wave» (`beta`, `active`) + цели активации и экосистемы
- Дашборд `/admin/beta-expansion`: пользователи, роли, активация, экосистема, сравнение с First Users
- Feedback loop: проблемы до/после Product Fix
- `BetaExpansionDecision`: continue_beta / open_beta_ready / needs_improvement
- Лия: «Как проходит расширенная beta?» → `BetaExpansionReport`
- Документация: `beta-expansion.md`

---

## 0.52.0-beta — 2026-08-06

Product Fix Sprint — исправления Critical/High по First Users Review (без новых крупных модулей).

### Изменения

- Дашборд `/admin/product-sprint`: проблемы Critical→Low, Impact Score, до/после активации
- `ProductFixSprintReport` + `ProductFixImprovementReport`
- Первый путь: Главная → Лия → Регистрация → Роль → Онбординг → Действие
- Пути ролей и empty states; Lia Improvement Notes (без смены логики движка)
- Аналитика: `product_fix_started`, `product_fix_completed`, `activation_after_fix`
- Лия: «Что улучшилось после исправлений?»
- Документация: `product-fix-sprint.md`

---

## 0.51.0-beta — 2026-08-06

First Users Review — анализ первой когорты и решение по следующей волне (без новых крупных модулей).

### Изменения

- Дашборд `/admin/first-users-review`: воронка, роли, Лия, Product Issues, ТИНДА, решение
- `FirstUsersLiaReport` + `FirstUsersReviewReport`
- `FirstUsersDecision`: continue_closed / expand_beta / prepare_public
- Лия: «Что показал первый запуск ЦКР?»
- Документация: `first-users-review.md`

---

## 0.50.0-beta — 2026-08-06

First Users Wave — ограниченный запуск на реальных пользователях (без новых крупных модулей).

### Изменения

- Launch Wave «First Users Wave» (`closed`, `active`) + цели когорты
- `beta_invites`: статус `active`, поле `source`, форма приглашения с ролью/источником
- Дашборд `/admin/first-users`: пользователи, сценарии, проблемы, Лия, путь участников
- Аналитика: `invite_sent`, `invite_accepted`, `first_login`, `lia_first_used`, `expert_profile_created`, `investment_interest_created`, `feedback_sent`
- Feedback loop: structured отзыв → feedback → pilot_issues → improvements
- Лия: «Как прошёл первый запуск ЦКР?» → `FirstUsersReport`
- Документация: `first-users-wave.md`

---

## 0.49.0-beta — 2026-08-06

First Users Launch — подготовка публичной платформы к первым реальным пользователям (без новых крупных модулей).

### Изменения

- `/trust` — цель ЦКР, путь работы, принципы доверия
- `/cases` — расширенный кейс ТИНДА (задача / что было / что сделал ЦКР / результат)
- После регистрации: «Что хотите сделать?» → Лия и первый путь роли
- Демо-бейдж на seed-объектах каталогов
- Аналитика воронки: `public_page_view`, `registration_started`, `registration_completed`, `lia_started`, `first_object_created`
- Документация: `first-users-launch.md`

---

## 0.48.0-beta — 2026-03-25

Public Marketplace Layer — публичная площадка ЦКР поверх существующих модулей.

### Изменения

- Главная: hero marketplace, путь работы, роли, каталоги, кейс ТИНДА, вход в Лию
- Каталоги `/projects`, `/experts`, `/investments`, `/opportunities` с поиском и фильтрами
- Презентация `/project/[id]` + ролевые страницы + `/how-it-works` + `/cases`
- Документация: `public-marketplace.md`

---

## 0.47.0-beta — 2026-03-25

Ecosystem Value — анализ ценности связей и качества совпадений (без новых бизнес-модулей).

### Изменения

- `EcosystemMatchingMetrics` + `MatchQualityScore` (воронка совпадений)
- Дашборд `/admin/ecosystem-value`: показатели, связи, MatchingChart, ConnectionTable
- Лия: «Какая польза от экосистемы ЦКР?» → `EcosystemValueReport`
- Документация: `ecosystem-value.md`, `tinda-ecosystem-review.md`

---

## 0.46.0-beta — 2026-03-25

Wave 2 — Ecosystem Beta: проверка сетевого эффекта ЦКР (без новых бизнес-модулей).

### Изменения

- Волна «Wave 2 — Ecosystem Beta» (`beta`, active) + цели пользователей / активации / экосистемы
- Дашборд `/admin/ecosystem-report`: связи, метрики, сценарии, ТИНДА production check
- Лия: «Как развивается экосистема ЦКР?» → `EcosystemReport`
- Документация: `ecosystem-beta.md`

---

## 0.45.0-beta — 2026-03-25

Launch Decision Gate — решение после Closed Wave 1 и подготовка Launch Wave 2 (без новых бизнес-модулей).

### Изменения

- Дашборд `/admin/launch-decision`: LaunchDecisionReport, triage улучшений, решение, Wave 2
- Таблица `launch_decisions` + seed Launch Wave 2 и целей экосистемы
- Лия: «Готов ли ЦКР к следующей волне?» → `LaunchDecisionAIReport`
- Документация: `launch-decision-gate.md`, `tinda-decision-report.md`

---

## 0.44.0-beta — 2026-03-25

Closed Wave Review — анализ результатов первой закрытой волны ТИНДА (без новых бизнес-модулей).

### Изменения

- Дашборд `/admin/wave-review`: волна, цели, активность, UX, Next Wave Decision
- `ClosedWaveReviewReport` + автосвязка проблем → pilot_issues → product_improvements
- Лия: «Проанализируй результаты первой волны» → `WaveReviewReport`
- Документация: `closed-wave-review.md`, `tinda-wave-review.md`

---

## 0.43.0-beta — 2026-03-25

Closed Wave 1 — ТИНДА: первая закрытая волна на реальном контуре ООО ТИНДА (без новых бизнес-модулей).

### Изменения

- Волна переименована в «Closed Wave 1 — ТИНДА»; цели активности / проекта / бизнеса
- Seed roadmap: подготовка → продажи (заявки) → масштабирование (партнёры / рост)
- Лия: «Проанализируй первую волну ЦКР» → `ClosedWaveReport`
- Отчёт: `closed-wave-tinda-report.md`

---

## 0.42.0-beta — 2026-03-25

Launch Success Framework — цели волн, метрики и анализ успешности запуска (без новых бизнес-модулей).

### Изменения

- Таблица `launch_goals` + seed целей Closed Wave / ТИНДА
- LaunchMetrics и блок «Цели волны» с ProgressBar на `/admin/launch`
- События: `launch_goal_created` / `achieved` / `failed` / `launch_wave_completed`
- Лия: «Достигнуты ли цели запуска?» → `LaunchGoalReport` (только анализ)
- Документация: `launch-success-framework.md`

---

## 0.41.0-beta — 2026-03-25

Wave Launch — волновой запуск ЦКР после Conditional Go (без новых бизнес-модулей).

### Изменения

- Таблицы `launch_waves` и `launch_wave_participants`
- Launch Dashboard `/admin/launch`: текущая волна, участники, активация, LaunchReport, ТИНДА
- Лия: «Как проходит запуск?» → `LaunchStatusReport` (только анализ)
- ТИНДА → production pilot case (волна closed)
- Документация: `wave-launch.md`, `tinda-production-case.md`

---

## 0.40.0-beta — 2026-03-25

Public Launch prep — подготовка к открытому запуску после Conditional Go (без новых бизнес-модулей).

### Изменения

- Launch Checklist `/admin/launch`: Product / Users / Technical / Business
- Интеграция product_improvements + pilot_issues + feedback (исправлено / запланировано / отклонено)
- Подсказки онбординга на точках высокого выхода; Launch analytics events
- Лия: «Как начать работу с ЦКР?» → `LaunchGuide`
- Документация: `help-center.md`, `public-launch-checklist.md`, `tinda-case-public.md`

---

## 0.39.0-beta — 2026-03-25

Beta Review — анализ закрытой beta и подготовка решения о Public Launch (без новых бизнес-модулей).

### Изменения

- Дашборд `/admin/beta-review`: пользователи, роли, воронка, модули, PMF
- `BetaReviewReport` и `LaunchReadinessReport` (данные + Лия)
- Лия: «Сделай обзор закрытой beta», «Что нужно исправить перед запуском?»
- Документация: `beta-review.md`, `public-launch-plan.md`, `tinda-beta-review.md`

---

## 0.38.0-beta — 2026-03-25

Controlled Beta — ограниченный запуск ЦКР на реальных пользователях (без новых бизнес-модулей).

### Изменения

- Статусы `beta_invites`: `invited` / `activated` / `completed` / `disabled` (+ legacy)
- Beta Participants на `/admin/pilot`, отчёт `/admin/beta-report`
- Онбординг-события в `analytics_events` (first_* / onboarding_*)
- Чеклисты сценариев ролей
- Лия: «Как проходит запуск ЦКР?» → `BetaAnalysisReport`
- Документация: `controlled-beta.md`, `tinda-beta-report.md`

---

## 0.37.0-beta — 2026-03-25

Product Improvement Loop — цикл улучшений на данных закрытого пилота (без новых бизнес-модулей).

### Изменения

- Таблица `product_improvements` + связь feedback → pilot_issues (`source_*`)
- Центр улучшений `/admin/improvements`
- Продвижение: feedback → issue → improvement
- Лия: «Что улучшить в ЦКР?» → `ProductImprovementReport` (только анализ)
- Документация: `product-improvement-loop.md`, `tinda-pilot-review.md`

---

## 0.36.0-beta — 2026-03-25

Pilot Operations — подготовка закрытого пилота и сбор реальных данных использования (без новых бизнес-направлений).

### Изменения

- Таблицы `pilot_participants`, `pilot_checklists`
- Feedback: категории `ux` / `business_value` / `lia_quality`, приоритет `low|medium|high|critical`
- Расширен `/admin/pilot`: участники, проекты, активность, чеклисты
- Отчёт `/admin/pilot/report`: воронка и использование
- Лия: «Что мешает проекту двигаться?» → `PilotInsightReport` (только анализ)
- Seed ТИНДА: участник пилота + чеклист
- Документация: `pilot-operations.md`, `tinda-pilot-progress.md`

---

## 0.35.0-beta — 2026-03-25

Финальная упаковка ЦКР 1.0 для закрытого пилота и демонстраций (без новых крупных модулей и сущностей БД).

### Изменения

- Аудит путей: `docs/user-flows.md`
- UX: пустые состояния каталогов / главной / Лии / dashboard
- Презентация: расширенный `/about`, новый `/features`
- Документация: `ckr-1.0-overview.md`, `demo-script.md`, `roadmap-after-1.0.md`
- Обновлены README, env.example, sitemap, навигация

---

## 0.34.0-beta — 2026-03-25

Project Outcomes — результаты проектов и эффективность сопровождения ЦКР.

### Изменения

- Таблицы `project_results`, `project_financial_metrics`
- Связь KPI → текущее → фактический результат
- Расчёты эффективности ЦКР (время, roadmap %, успешность)
- Панель `/admin/results` (ResultsCard, OutcomeChart, ProjectOutcomeTable)
- Лия: «Оцени результат проекта» → `OutcomeReport`
- Аналитика: `result_created`, `financial_metric_updated`, `project_completed`, `outcome_generated`
- Пилот ТИНДА: подготовка результатов и финпоказателей
- Документ `docs/project-outcomes.md`

---

## 0.33.0-beta — 2026-03-25

Project Execution — управление реализацией проектов (без новых крупных модулей).

### Изменения

- Таблицы `project_roadmaps`, `roadmap_items`, `project_metrics` + связь `tasks.roadmap_item_id`
- Компонент `ProjectProgress` в workspace (этап, %, задачи, просрочки, KPI)
- Лия: «Проверь прогресс проекта» → `ProgressReport`
- Аналитика: `roadmap_created`, `roadmap_item_completed`, `metric_updated`, `project_progress_checked`
- Пилот ТИНДА: roadmap (подготовка / продажи / масштабирование) + KPI
- Документ `docs/project-execution.md`

---

## 0.32.0-beta — 2026-03-25

Методология ЦКР и стандартизация сопровождения проектов (без крупных модулей).

### Изменения

- Шаблоны проектов: `new_business`, `business_development`, `investment_project`, `business_optimization` (цели, этапы, данные, действия)
- Документ `docs/ckr-methodology.md` (этапы 1–6)
- Лия: сценарий «Разработать стратегию развития» → `StrategyReport`
- Структуры черновиков: `BusinessPlanDraft`, `RoadmapDraft`, `InvestmentProposalDraft` (без генерации файлов)
- Пилот ТИНДА: текущий этап методологии, стратегические цели, roadmap

---

## 0.31.0-beta — 2026-03-25

Улучшения ЦКР по итогам пилота ООО ТИНДА (без крупных модулей).

### Изменения

- Case study: `docs/tinda-case-study.md`
- Шаблон проекта `business_development`
- Лия: сценарий «Аудит бизнеса» → `BusinessAuditReport`
- CRM-шаблоны сегментов: customers / suppliers / partners
- Матрица улучшений: `docs/tinda-improvements.md`

---

## 0.30.0-beta — 2026-03-25

Первый пилот на организации ООО ТИНДА (без новых бизнес-модулей).

### Изменения

- Seed пилота: организация, проект, milestones, CRM-сегменты, сделка, анализ Лии, reputation
- API `POST /api/pilot/tinda-seed` + `npm run seed:tinda`
- Документ `docs/tinda-pilot.md` (цель, модули, проблемы, результаты, улучшения)
- Ссылка на пилот ТИНДА в `/admin/pilot`

---

## 0.29.0-beta — 2026-03-25

Инструменты проведения closed pilot (без новых бизнес-модулей).

### Изменения

- `/admin/pilot` — Pilot Dashboard (участники, проекты, заявки, сделки, Лия, метрики)
- Метрики: `registration_completed`, `profile_completed`, `project_created`, `project_published`, `application_sent`, `deal_created`, `lia_used`
- Feedback: связь с пользователем, страницей и объектом (`related_type` / `related_id`)
- `pilot_issues` (severity + status) в dashboard
- Документ: `docs/closed-pilot.md`

---

## 0.28.0-beta — 2026-03-25

Closed pilot: закрыты критические ограничения launch-readiness.

### Изменения

- Application → Deal: `deals.application_id`, кнопка «Создать сделку», история в карточке сделки
- `investor_interests` + «Интересно» + `/dashboard/interests`
- Operator vs admin: `requireStaff` для CRM и модерации; admin-only для users/invites/analytics
- Лия: рекомендации с учётом интересов, заявок и сделок
- Обновлён `docs/launch-readiness.md` (статус closed pilot)

---

## 0.27.0-beta — 2026-03-25

Финальный аудит перед 1.0 (без новых бизнес-функций).

### Изменения

- Отчёт готовности: `docs/launch-readiness.md`
- Онбординг роли `company` → `/partner`
- Middleware: защита `/messages`
- Аудит сценариев ролей, данных, Лии и доступов

---

## 0.26.0-beta — 2026-03-25

Подготовка к production (без новых бизнес-модулей).

### Изменения

- Аудит безопасности + ужесточение `create_notification` / `log_activity_feed`
- Таблица `system_logs` + единый формат ошибок API
- Проверка доступа при загрузке документов; demo seed blocked in production
- Лимиты каталогов, индекс проектов, фикс счётчиков dashboard
- Документация: `security-audit.md`, `deployment.md`, `backup.md`, `production-checklist.md`

---

## 0.25.0-beta — 2026-03-25

Финализация ядра ЦКР перед 1.0 (стабилизация, без новых крупных функций).

### Изменения

- Единый жизненный цикл проекта: `draft → moderation → published → active → completed → archived`
- `/dashboard` — единый обзор (проекты, заявки, инвестиции, сделки, уведомления, задачи, Лия)
- События: документ / сделка / принятие заявки / завершение этапа → notifications + analytics
- UX: confirm для архива, EmptyState на обзоре проектов
- Документация: `platform-overview.md`, `core-audit.md`, `roles-and-permissions.md`, `lia-flows.md`

---

## 0.24.0-beta — 2026-03-25

Репутация и доверие ЦКР.

### Изменения

- `reputation_profiles`, `reviews`, `entity_history`, `trust_badges` + RLS
- Публичный `/profile/[id]`: рейтинг, отзывы, история, бейджи
- Сценарий Лии «Проверь надёжность участника» (`check_reliability`) — факты без вердикта
- История участия при завершении сделок / этапов и партнёрствах
- Документация `docs/reputation.md`

---

## 0.23.0-beta — 2026-03-25

Партнёрская сеть ЦКР.

### Изменения

- `organizations`, `organization_members`, `partnerships` + RLS
- Кабинет `/partner` (профиль, сотрудники, проекты, предложения, заявки)
- `organization_id` на projects / opportunities / investment_offers
- Сценарии Лии для организации
- Документация `docs/partners.md`

---

## 0.22.0-beta — 2026-03-25

Операционный центр ЦКР.

### Изменения

- `/operator` — OperatorStats, OperatorQueue, OperatorActivity, OperatorInsights
- Таблицы `tasks`, `operator_roles`, `sla_rules` + RLS `is_operator`
- Задачи со связями lead / project / deal / document / verification
- Базовые SLA: lead 24ч, application 48ч, verification 72ч
- Документация `docs/operator-center.md`

---

## 0.21.0-beta — 2026-03-25

CRM ЦКР: внутренняя система операторов.

### Изменения

- Таблицы `crm_contacts`, `leads`, `crm_activities` + RLS
- Dashboard `/admin/crm` (контакты, лиды, задачи, история)
- Конвертация лида с подтверждением администратора
- Архитектура Лии для оператора (`lia-operator`)
- Документация `docs/crm.md`

---

## 0.20.0-beta — 2026-03-25

Closed beta: подготовка к запуску для первых реальных пользователей.

### Изменения

- Система приглашений `beta_invites` и админка `/admin/invites`
- Обратная связь `feedback` и кнопка FeedbackButton
- Оценка ключевых сценариев `user_feedback_events`
- Beta badge с версией платформы
- Seed-категории и расширенное наполнение каталогов (без реальных ПДн)
- Документация `docs/beta-launch.md`

---

## 0.19.0 — продуктовое тестирование

- Сценарии прохождения и `/admin/product-tests`
- Задачи, чеклисты, статусы качества

---

## 0.18.0 — демонстрационный запуск

- Demo seed, онбординг, demo mode
- Публичные каталоги без регистрации

---

Формат записи: **версия · дата · изменения**.
Новые релизы добавляются сверху.
