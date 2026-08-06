# Лия — ИИ-навигатор ЦКР

## Роль Лии

Лия помогает пользователю **находить решения внутри платформы ЦКР**.

Цепочка:

**Идея → Анализ → Проект → Поиск ресурсов → Комплексное решение → Реализация**

Подробности Этапа 11 (анализ, внутренний/внешний поиск, SolutionReport): [lia-solutions.md](./lia-solutions.md).

На Этапе 9 Лия — безопасный MVP:

- читает открытые каталоги;
- ведёт диалоги;
- собирает черновики и рекомендации;
- **не** изменяет данные платформы самостоятельно;
- **не** выполняет финансовые или юридические действия.

Все ответы помечены как предварительные рекомендации.

---

## Архитектура

```text
UI /lia + LiaWidget
        ↓
POST /api/lia  (server only)
        ↓
auth + rate limit + validations
        ↓
lia_sessions / lia_messages (Supabase RLS)
        ↓
runLiaEngine()
   ├─ searchProjects / Opportunities / Investments / Experts
   ├─ сценарии (business idea, solution draft, …)
   └─ provider.ts  (mock | openai-compatible)
```

Ключевые файлы:

| Путь | Назначение |
|---|---|
| `src/app/(public)/lia/page.tsx` | Страница диалогов |
| `src/app/api/lia/route.ts` | Серверный endpoint |
| `src/lib/lia/provider.ts` | Абстракция ИИ-провайдера |
| `src/lib/lia/engine.ts` | Сценарии и сборка ответов |
| `src/lib/lia/search/` | InternalSearchProvider + WebSearchProvider ([external-search.md](./external-search.md)) |
| `src/features/lia/components/lia-chat.tsx` | Клиентский чат |
| `src/components/lia/lia-widget.tsx` | Плавающий / embedded виджет |

---

## База данных

### `lia_sessions`

Диалог пользователя: `user_id`, `title`, опциональный `context_type` / `context_id`.

### `lia_messages`

Сообщения: `role` (`user` | `assistant` | `system` | `tool`), `content`, `metadata` (jsonb).

RLS: пользователь видит и меняет только свои сессии/сообщения; admin — полный доступ.

Миграция: `supabase/migrations/20260325210000_lia_sessions_and_messages.sql`.

---

## Сценарии

1. **Помоги создать бизнес-проект** — сценарий «От идеи до проекта»: вопросы → `ProjectDraft` → preview → подтверждение → `projects` (draft). Подробнее: [project-flow.md](./project-flow.md).  
2. **Найди инвестиционные предложения** — `searchInvestments`.  
3. **Найди землю или помещение** — `searchOpportunities` с приоритетом land/premises.  
4. **Подбери эксперта** — `searchExperts`.  
5. **Собери комплексное решение** — `SolutionDraft` (аналитическая сборка, не запись в БД).
6. **Проверь надёжность участника** — `check_reliability`: факты, документы, история; без окончательного вердикта. Подробнее: [reputation.md](./reputation.md).
7. **Аудит бизнеса** — `business_audit` → `BusinessAuditReport`.
8. **Разработать стратегию развития** — `develop_strategy`: данные проекта, аудит, цели → `StrategyReport` (цели, направления роста, ресурсы, риски, план действий). См. [ckr-methodology.md](./ckr-methodology.md).
9. **Проверь прогресс проекта** — `check_progress` → `ProgressReport`.
10. **Оцени результат проекта** — `evaluate_outcome` → `OutcomeReport` (достижения, просадки, риски, рекомендации). См. [project-outcomes.md](./project-outcomes.md).
11. **Что мешает проекту двигаться?** — `pilot_insight` → `PilotInsightReport` (блокировки, неактивные участники, рекомендации; только анализ). См. [pilot-operations.md](./pilot-operations.md).
12. **Что улучшить в ЦКР?** — `product_improvement` → `ProductImprovementReport` (проблемы, паттерны, приоритетные действия; только анализ). См. [product-improvement-loop.md](./product-improvement-loop.md).
13. **Как проходит запуск ЦКР?** — `beta_analysis` → `BetaAnalysisReport` (активация, блокеры, неиспользуемые функции; только анализ). См. [controlled-beta.md](./controlled-beta.md).
14. **Сделай обзор закрытой beta** — `beta_review` → `BetaReviewReport` (только по данным). См. [beta-review.md](./beta-review.md).
15. **Что нужно исправить перед запуском?** — `launch_readiness` → `LaunchReadinessReport` (только анализ). См. [public-launch-plan.md](./public-launch-plan.md).
16. **Как начать работу с ЦКР?** — `launch_guide` → `LaunchGuide` (роль + первый шаг; только подсказки). См. [help-center.md](./help-center.md), [public-launch-checklist.md](./public-launch-checklist.md).
17. **Как проходит запуск?** — `launch_status` → `LaunchStatusReport` (активность волны, блокеры, рекомендации; только анализ). См. [wave-launch.md](./wave-launch.md).
18. **Достигнуты ли цели запуска?** — `launch_goals` → `LaunchGoalReport` (achieved / failed, risks, next_actions; только анализ). См. [launch-success-framework.md](./launch-success-framework.md).
19. **Проанализируй первую волну ЦКР** — `closed_wave` → `ClosedWaveReport` (цели, UX, бизнес-результаты; только анализ). См. [closed-wave-tinda-report.md](./closed-wave-tinda-report.md).
20. **Проанализируй результаты первой волны** — `wave_review` → `WaveReviewReport` (success factors, problems, patterns; только анализ). См. [closed-wave-review.md](./closed-wave-review.md).
21. **Готов ли ЦКР к следующей волне?** — `launch_decision` → `LaunchDecisionAIReport` (strengths, weaknesses, risks, recommendation; только анализ). См. [launch-decision-gate.md](./launch-decision-gate.md).

Структура результата поиска:

- `type`, `id`, `title`, `summary`, `href`

---

## Ограничения безопасности

- вызовы ИИ только на сервере;
- `/api/lia` требует авторизации;
- лимит длины сообщения (`LIA_MAX_MESSAGE_LENGTH`);
- базовый in-memory rate limit на пользователя;
- в модель не передаются приватные документы и личные данные профилей;
- только чтение каталогов + рекомендации;
- явный disclaimer в каждом ответе.

---

## Переменные окружения

```bash
# Провайдер: mock (по умолчанию) | openai
LIA_PROVIDER=mock

# Ключ API (не использовать на клиенте)
LIA_API_KEY=

# Базовый URL OpenAI-compatible API (если пусто — fallback на mock даже при ключе)
LIA_API_BASE_URL=

# Модель (для openai-compatible)
LIA_MODEL=gpt-4o-mini
```

Если `LIA_API_KEY` не задан или `LIA_PROVIDER=mock`, работает локальный mock-режим со сценариями и поиском по ЦКР.

---

## Подключение провайдера ИИ

1. Реализуйте/выберите провайдер в `src/lib/lia/provider.ts` (`LiaProvider` контракт).  
2. Задайте `LIA_PROVIDER`, `LIA_API_KEY`, при необходимости `LIA_API_BASE_URL` и `LIA_MODEL`.  
3. Не вызывайте провайдер из клиентских компонентов.  
4. Сохраняйте правило: в prompt только сообщение пользователя + краткая история, без документов Storage.

---

## UI

- `/lia` — список диалогов, окно сообщений, ввод, быстрые сценарии, ссылки на объекты.  
- `LiaWidget` — плавающий на сайте; embedded-карточка на главной и в кабинете.  
- Черновик проекта передаётся в `/dashboard/projects/create?...` без автосохранения.
