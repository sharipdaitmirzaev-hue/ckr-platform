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

### Сделано в коде

1. Clients `@supabase/ssr`, middleware сессии, env  
2. Миграция `profiles` + `user_roles` + trigger + RLS  
3. `/login`, `/register`, `/onboarding`, logout, `getCurrentUser()`  
4. Защита `/dashboard`  
5. Документация `docs/auth.md`

### Что нужно со стороны Supabase-проекта

- Создать проект и прописать ключи в `.env.local`
- Применить SQL-миграцию
- (Опционально) отключить confirm email для удобной разработки

### Вне скоупа Этапа 1

- CRUD проектов и каталоги из БД
- Storage документов
- Лия API
- OAuth-провайдеры

## Этап 2 — Проекты

- CRUD, каталог, фильтры, детальная страница

## Этап 3 — Возможности

- Типы активов, каталог, создание

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
