# Архитектура ЦКР

## Позиционирование

**ЦКР — Центр комплексных решений** — бизнес-платформа, а не доска объявлений.

Логика: **Идея → Анализ → Решения → Ресурсы → Реализация.**

Слоган: *Партнёрство. Надёжность. Результат.*

Подробнее о продукте: [product.md](./product.md).

## Стек (MVP / Этап 0)

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Один репозиторий приложения (без monorepo), структура готова к масштабированию
- Supabase (Auth, PostgreSQL, Storage, API) — подключение с Этапа 1
- ИИ-навигатор **Лия** — заготовка UI + `/api/lia`

## Ключевые UI-компоненты

| Компонент | Путь |
|---|---|
| Header | `components/layout/site-header.tsx` |
| Footer | `components/layout/site-footer.tsx` |
| Logo / Shield | `components/brand/logo.tsx`, `shield-mark.tsx` |
| ProjectCard | `components/projects/project-card.tsx` |
| OpportunityCard | `components/opportunities/opportunity-card.tsx` |
| SolutionCard | `components/solutions/solution-card.tsx` |
| LiaWidget | `components/lia/lia-widget.tsx` |
| Card / Button | `components/ui/card.tsx`, `button.tsx` (+ общие `button-variants`) |

## Маршруты

| Путь | Назначение |
|---|---|
| `/` | Главная |
| `/projects` | Каталог проектов |
| `/opportunities` | Каталог возможностей |
| `/solutions` | Модуль решений |
| `/login` | Вход |
| `/register` | Регистрация |
| `/onboarding` | Профиль и мультироли |
| `/dashboard` | Личный кабинет (только auth) |

## Модули

| Модуль | Назначение | Статус в Этапе 0 |
|---|---|---|
| Проекты | Каталог и карточки проектов | Каркас + mock + ProjectCard |
| Возможности | Земля, помещения, оборудование… | Каркас + mock + OpportunityCard |
| Решения | Комплексные предложения | Каркас + mock + SolutionCard |
| Auth / Dashboard | Регистрация, ЛК | UI-заготовки |
| Лия | ИИ-навигатор | Виджет + API placeholder |

## Слои

1. `app/` — маршруты и layouts  
2. `components/` — UI, layout, brand, domain cards, lia  
3. `config/` — бренд, навигация, сайт  
4. `lib/` — utils, mock, supabase stubs  
5. `types/` — доменные типы  
6. `supabase/` — миграции и functions (далее)  

## Дизайн-токены

Цвета задаются только через CSS-переменные `--ckr-*` (`globals.css`) и Tailwind-маппинг (`background`, `foreground`, `muted`, `accent`, `surface`, `border`).  
Hex-значения дублируются в `config/brand.ts` как справочник бренда.

## Безопасность (план)

- Supabase Auth + RLS на все таблицы
- Server Components / Route Handlers для чувствительных операций
- Storage buckets с signed URLs для документов
