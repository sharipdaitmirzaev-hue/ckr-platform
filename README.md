# ЦКР — Центр комплексных решений

Цифровая бизнес-платформа: предприниматели, инвесторы, владельцы активов и эксперты.

**Партнёрство. Надёжность. Результат.**

Логика платформы: **Идея → анализ → поиск ресурсов → партнёры → реализация.**

## Стек

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (подключение с Этапа 1)

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

Скопируйте `.env.example` в `.env.local` и укажите ключи Supabase.

Примените миграцию из `supabase/migrations/` (см. [docs/auth.md](./docs/auth.md)).

## Структура

```text
src/app            # маршруты (public, auth, dashboard, api)
src/components     # ui, layout, brand, lia
src/config         # бренд, навигация, site
src/lib            # utils, supabase stubs
src/types          # доменные типы
docs               # архитектура и roadmap
supabase           # миграции и functions (далее)
```

## Документация

- [Продукт](./docs/product.md)
- [Auth](./docs/auth.md)
- [Проекты](./docs/projects.md)
- [Возможности](./docs/opportunities.md)
- [Заявки](./docs/applications.md)
- [Инвестиции](./docs/investments.md)
- [Эксперты](./docs/experts.md)
- [Архитектура](./docs/architecture.md)
- [Roadmap](./docs/roadmap.md)

## Фирменный стиль

| Токен | Значение |
|---|---|
| Фон | `#071522` |
| Светлый | `#F2F2F2` |
| Вторичный | `#BFC4CA` |
| Акцент | `#C9A227` |
