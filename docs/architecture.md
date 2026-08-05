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
| `/` | Главная (публичный UX) |
| `/entrepreneurs` | Для предпринимателей |
| `/investors` | Для инвесторов |
| `/experts` | Для экспертов + каталог |
| `/profile/[id]` | Публичный профиль |
| `/projects` | Каталог проектов |
| `/project/[id]` | Страница проекта |
| `/opportunities` | Каталог возможностей |
| `/opportunity/[id]` | Страница возможности |
| `/solutions` | Модуль решений |
| `/pricing` | Тарифы ЦКР |
| `/services` | Услуги ЦКР |
| `/demo` | Демонстрационный доступ |
| `/dashboard/billing` | Оплата и подписка |
| `/login` | Вход |
| `/register` | Регистрация |
| `/onboarding` | Профиль, роли, приватность |
| `/dashboard` | Личный кабинет (только auth) |
| `/dashboard/projects` | Мои проекты |
| `/dashboard/projects/create` | Создание проекта |
| `/dashboard/opportunities` | Мои возможности |
| `/dashboard/opportunities/create` | Создание возможности |
| `/dashboard/applications` | Входящие / исходящие заявки |
| `/investments` | Каталог инвестиционных предложений |
| `/investment/[id]` | Карточка инвестиции |
| `/dashboard/investments` | Мои инвестиционные предложения |
| `/experts` | Каталог экспертов |
| `/expert/[id]` | Карточка эксперта |
| `/dashboard/expert` | Профиль эксперта |
| `/dashboard/expert/create` | Создание профиля эксперта |
| `/dashboard/documents` | Документы и заявки на проверку |
| `/admin/dashboard` | Админ: сводка платформы |
| `/admin/users` | Админ: пользователи |
| `/admin/projects` | Админ: модерация проектов |
| `/admin/opportunities` | Админ: модерация возможностей |
| `/admin/investments` | Админ: модерация инвестиций |
| `/admin/experts` | Админ: проверка экспертов |
| `/admin/verifications` | Админ: заявки на верификацию |
| `/admin/analytics` | Админ: аналитика платформы |
| `/admin/product-tests` | Админ: продуктовые тесты |
| `/lia` | ИИ-навигатор Лия |
| `/api/lia` | Серверный API Лии |

## Модули

| Модуль | Назначение | Статус |
|---|---|---|
| Проекты | Центральная сущность платформы | Этап 2: БД + CRUD + каталог |
| Возможности | Ресурсы для проектов | Этап 3: БД + CRUD + каталог |
| Решения | Комплексные предложения | Каркас + mock + SolutionCard |
| Auth / Dashboard | Регистрация, роли, ЛК | Этап 1: Supabase Auth |
| Заявки | Взаимодействия участников | Этап 4: applications + notifications |
| Инвестиции | Предложения капитала | Этап 5: investment_offers |
| Эксперты | Система доверия и компетенций | Этап 6: expert_profiles |
| Документы / верификация | Доверие ЦКР, Storage | Этап 7 |
| Админ-панель | Рабочее место оператора | Этап 8 |
| Лия | ИИ-навигатор платформы | Этап 9: /lia + API + сценарии |
| От идеи до проекта | Сценарий Лия → draft проекта | Этап 10 |
| Публичная платформа | Главная, роли, профили, SEO | Этап 15 |
| Монетизация | Тарифы, услуги, комиссии, PaymentProvider | Этап 16 |
| Аналитика | События, админ-метрики, аналитика проекта | Этап 17 |
| Demo launch | Seed, онбординг, demo mode, UX states | Этап 18 |
| Продуктовые тесты | Сценарии, задачи, контроль качества | Этап 19 |
| Closed beta | Приглашения, feedback, оценка сценариев | Этап 20 |
| CRM | Контакты, лиды, задачи операторов ЦКР | Этап 21 |
| Операционный центр | Очередь, tasks, SLA, OperatorInsights | Этап 22 |

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
