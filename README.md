# ЦКР — Центр комплексных решений

Цифровая бизнес-платформа: предприниматели, инвесторы, владельцы активов, эксперты и организации.

**Партнёрство. Надёжность. Результат.**

Логика платформы: **Идея → анализ → поиск ресурсов → партнёры → реализация.**

Текущая версия ядра: **0.63.0-beta** (First Deals & Revenue).  
Обзор: [First Deals & Revenue](./docs/first-deals-and-revenue.md) · [Partnership Network](./docs/partnership-network.md) · [Project Acquisition](./docs/project-acquisition-engine.md) · [Help center](./docs/help-center.md)

## Стек

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, RLS, Storage)

## Быстрый старт

```bash
npm install
cp .env.example .env.local
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

Примените миграции из `supabase/migrations/` (см. [supabase/README.md](./supabase/README.md)).

```bash
npm run lint
npm run build
```

## Структура

```text
src/app            # маршруты (public, auth, dashboard, admin, operator, partner, api)
src/components     # ui, layout, brand, domain, lia
src/features       # server actions и feature UI
src/config         # бренд, роли, сценарии Лии, статусы
src/lib            # queries, auth gates, analytics, reputation
src/types          # доменные и DB типы
docs               # продукт, архитектура, модули
supabase           # миграции
```

## Документация

### 1.0 / пилот

- [Обзор ЦКР 1.0](./docs/ckr-1.0-overview.md)
- [Пользовательские пути](./docs/user-flows.md)
- [Demo-сценарий](./docs/demo-script.md)
- [Roadmap после 1.0](./docs/roadmap-after-1.0.md)
- [Пилот ТИНДА](./docs/tinda-pilot.md)
- [Прогресс пилота ТИНДА](./docs/tinda-pilot-progress.md)
- [Closed pilot](./docs/closed-pilot.md)
- [Pilot Operations](./docs/pilot-operations.md)
- [Цикл улучшений](./docs/product-improvement-loop.md)
- [Обзор пилота ТИНДА](./docs/tinda-pilot-review.md)
- [Controlled Beta](./docs/controlled-beta.md)
- [ТИНДА beta report](./docs/tinda-beta-report.md)
- [Beta Review](./docs/beta-review.md)
- [Public launch plan](./docs/public-launch-plan.md)
- [Public launch checklist](./docs/public-launch-checklist.md)
- [Wave launch](./docs/wave-launch.md)
- [Launch success framework](./docs/launch-success-framework.md)
- [Closed Wave ТИНДА — отчёт](./docs/closed-wave-tinda-report.md)
- [Closed Wave Review](./docs/closed-wave-review.md)
- [ТИНДА wave review](./docs/tinda-wave-review.md)
- [Launch Decision Gate](./docs/launch-decision-gate.md)
- [ТИНДА decision report](./docs/tinda-decision-report.md)
- [Wave 2 Ecosystem Beta](./docs/ecosystem-beta.md)
- [Ecosystem Value](./docs/ecosystem-value.md)
- [ТИНДА ecosystem review](./docs/tinda-ecosystem-review.md)
- [Public Marketplace](./docs/public-marketplace.md)
- [Help center](./docs/help-center.md)
- [ТИНДА production case](./docs/tinda-production-case.md)
- [ТИНДА публичный кейс](./docs/tinda-case-public.md)
- [ТИНДА beta review](./docs/tinda-beta-review.md)

### Ядро

- [Обзор платформы](./docs/platform-overview.md)
- [Методология ЦКР](./docs/ckr-methodology.md)
- [Project Execution](./docs/project-execution.md)
- [Project Outcomes](./docs/project-outcomes.md)
- [Потоки Лии](./docs/lia-flows.md)
- [Архитектура](./docs/architecture.md)
- [Roadmap](./docs/roadmap.md)
- [Changelog](./docs/changelog.md)
- [Launch readiness](./docs/launch-readiness.md)
- [Деплой](./docs/deployment.md) · [Backup](./docs/backup.md) · [Production checklist](./docs/production-checklist.md)

### Модули

- [Продукт](./docs/product.md) · [Auth](./docs/auth.md) · [Проекты](./docs/projects.md)
- [Возможности](./docs/opportunities.md) · [Заявки](./docs/applications.md) · [Инвестиции](./docs/investments.md)
- [Эксперты](./docs/experts.md) · [Верификация](./docs/verification.md) · [Админ](./docs/admin.md)
- [Лия](./docs/lia.md) · [Сделки и workspace](./docs/deals-and-workspace.md)
- [CRM](./docs/crm.md) · [Операторский центр](./docs/operator-center.md) · [Партнёры](./docs/partners.md)
- [Репутация](./docs/reputation.md) · [Публичная платформа](./docs/public-platform.md)

## Фирменный стиль

| Токен | Значение |
|---|---|
| Фон | `#071522` |
| Светлый | `#F2F2F2` |
| Вторичный | `#BFC4CA` |
| Акцент | `#C9A227` |
| Surface | `#0C1E2E` |

Шрифты: Manrope (UI), Onest (display).
