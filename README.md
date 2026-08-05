# ЦКР — Центр комплексных решений

Цифровая бизнес-платформа: предприниматели, инвесторы, владельцы активов, эксперты и организации.

**Партнёрство. Надёжность. Результат.**

Логика платформы: **Идея → анализ → поиск ресурсов → партнёры → реализация.**

Текущая версия ядра: **0.33.0-beta** (Project Execution). Обзор: [docs/platform-overview.md](./docs/platform-overview.md) · [Execution](./docs/project-execution.md) · [Методология](./docs/ckr-methodology.md).

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

### Ядро

- [Обзор платформы](./docs/platform-overview.md)
- [Аудит ядра](./docs/core-audit.md)
- [Аудит безопасности](./docs/security-audit.md)
- [Launch readiness 1.0](./docs/launch-readiness.md)
- [Деплой](./docs/deployment.md) · [Backup](./docs/backup.md) · [Production checklist](./docs/production-checklist.md)
- [Роли и права](./docs/roles-and-permissions.md)
- [Потоки Лии](./docs/lia-flows.md)
- [Методология ЦКР](./docs/ckr-methodology.md)
- [Project Execution](./docs/project-execution.md)
- [Архитектура](./docs/architecture.md)
- [Roadmap](./docs/roadmap.md)
- [Changelog](./docs/changelog.md)

### Модули

- [Продукт](./docs/product.md) · [Auth](./docs/auth.md) · [Проекты](./docs/projects.md)
- [Возможности](./docs/opportunities.md) · [Заявки](./docs/applications.md) · [Инвестиции](./docs/investments.md)
- [Эксперты](./docs/experts.md) · [Верификация](./docs/verification.md) · [Админ](./docs/admin.md)
- [Лия](./docs/lia.md) · [Сделки и workspace](./docs/deals-and-workspace.md)
- [Коммуникации](./docs/notifications-and-communication.md) · [Публичная платформа](./docs/public-platform.md)
- [Монетизация](./docs/monetization.md) · [Аналитика](./docs/analytics.md)
- [Demo](./docs/demo-launch.md) · [Beta](./docs/beta-launch.md) · [CRM](./docs/crm.md)
- [Операторский центр](./docs/operator-center.md) · [Партнёры](./docs/partners.md) · [Репутация](./docs/reputation.md)

## Фирменный стиль

| Токен | Значение |
|---|---|
| Фон | `#071522` |
| Светлый | `#F2F2F2` |
| Вторичный | `#BFC4CA` |
| Акцент | `#C9A227` |

Цвета в UI — через CSS-переменные `--ckr-*` и Tailwind-токены (`background`, `foreground`, `muted`, `accent`, `surface`, `border`).
