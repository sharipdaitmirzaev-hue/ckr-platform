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

## Этап 4 — Решения + заявки

- Комплексные предложения
- Универсальные applications

## Этап 5 — Эксперты и инвестиции

- Профили экспертов
- Инвестиционные предложения

## Этап 6 — Сообщения, избранное, документы

## Этап 7 — Лия (навигатор)

- Помощь в создании проекта, анализ, подбор ресурсов и решений

## Этап 8 — Admin, API для мобильного приложения
