# Changelog ЦКР

Версия платформы отражается в интерфейсе бейджем **Beta**.

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
