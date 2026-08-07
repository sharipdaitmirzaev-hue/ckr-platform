# Public Website Packaging & Marketplace Launch

Этап 65. Упаковка существующей платформы ЦКР в понятный публичный сайт и marketplace.  
Новые крупные бизнес-модули не добавлялись.

Версия: **0.65.0-beta**.

---

## 1. Структура сайта

| Маршрут | Назначение |
|---|---|
| `/` | Hero: ценность ЦКР за 10 секунд + 3 CTA |
| `/lia` | Главный пользовательский вход (аудит → отчёт → шаг) |
| `/entrepreneur` | Путь: Идея → Анализ → Проект → Эксперты → Партнёры → Развитие |
| `/investor` | Проекты, возможности, аналитика, интересы |
| `/expert` | Участие, компетенции, репутация |
| `/organization` | Партнёрство, проекты, возможности |
| `/projects` `/investments` `/opportunities` `/experts` | Marketplace |
| `/cases` | Кейс ТИНДА (реальные vs планируемые результаты) |
| `/trust` | Как работает, роли, репутация, история, прозрачность |
| `/services` | Услуги на базе `services` |
| `/register` → `/onboarding` | Регистрация → роль → первое действие |

SEO: `src/app/sitemap.ts`, `robots.ts`, metadata / Open Graph на публичных страницах.

---

## 2. Пользовательские пути

### Посетитель → пользователь

1. Главная или роль  
2. **Лия** (`business_audit`) — описание ситуации  
3. Вопросы Лии → `BusinessAuditReport`  
4. Следующий шаг: создать проект / консультация / найти ресурсы  
5. Регистрация → выбор роли → онбординг → первое действие  

### Роли

- **Предприниматель:** аудит / идея → проект → эксперты → партнёры → развитие  
- **Инвестор:** проекты → интерес → кабинет  
- **Эксперт:** профиль → репутация → запросы  
- **Организация:** профиль → партнёрство → проекты / возможности  

---

## 3. Основные сценарии

1. **Аудит бизнеса** — `/lia?scenario=business_audit` → BusinessAuditReport  
2. **Разместить проект** — регистрация → create project  
3. **Найти возможности** — `/opportunities` (+ поиск/фильтры)  
4. **Кейс ТИНДА** — `/cases` (реальные результаты отдельно от плана)  
5. **Услуги** — `/services` (аудит, сопровождение, партнёры, экспертиза, инвестиции)  

---

## 4. Конверсионные точки

| Точка | CTA / событие |
|---|---|
| Hero | Получить аудит / Разместить проект / Найти возможности |
| `PublicLiaEntry` | Старт аудита + регистрация |
| Marketplace headers | Разместить / Аудит / Смотреть проекты |
| `/register` | `registration_started` → `registration_completed` |
| Карточка проекта | `project_viewed` |
| `/services` | `service_viewed` |
| `/cases` | `case_viewed` |
| `/lia` (public) | `lia_started_from_public` |
| `/` | `homepage_view` |

Конфиг точек: `src/config/public-website.ts` → `PUBLIC_CONVERSION_POINTS`.

---

## 5. Что не менялось

- Нет новых каталогов/CRM/платежей  
- Используются projects, experts, investments, opportunities, organizations, lia, cases, reputation, services, analytics  
- Платежи остаются mock  

См. также: [public-marketplace.md](./public-marketplace.md), [go-live.md](./go-live.md), [monetization.md](./monetization.md).
