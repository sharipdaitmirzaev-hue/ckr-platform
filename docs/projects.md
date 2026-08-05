# Модуль «Проекты» — ЦКР

Проект — **центральная сущность** платформы.

Вокруг проекта в будущем связываются:

- инвесторы;
- возможности;
- эксперты;
- документы;
- заявки;
- решения.

Проект — не объявление маркетплейса, а карточка бизнес-замысла / действующего бизнеса для комплексной реализации.

---

## Структура `projects`

| Поле | Тип | Описание |
|---|---|---|
| `id` | uuid | PK |
| `owner_id` | uuid | Владелец → `profiles.id` |
| `title` | text | Название |
| `slug` | text | Уникальный URL-slug |
| `summary` | text | Краткое описание для каталога |
| `description` | text | Полное описание |
| `category` | text | Slug категории → `categories.slug` |
| `region` | text | Регион |
| `investment_required` | numeric | Требуемые инвестиции |
| `currency` | text | Валюта (`RUB` / `USD` / `EUR`) |
| `stage` | enum | Стадия бизнеса (idea…expansion) |
| `status` | enum | Жизненный цикл на платформе |
| `cover_url` | text | Обложка (заготовка) |
| `created_at` / `updated_at` | timestamptz | Служебные |

---

## Категории (`categories`)

| Поле | Описание |
|---|---|
| `id` | uuid |
| `name` | Название |
| `icon` | Ключ иконки |
| `slug` | Уникальный slug |

Начальный набор:

Производство · Недвижимость · Сельское хозяйство · Туризм · IT · Торговля · Услуги · Энергетика

---

## Жизненный цикл (`status`)

```text
draft → moderation → published → active → completed → archived
```

| Статус | Смысл |
|---|---|
| `draft` | Черновик, виден только владельцу |
| `moderation` | На проверке перед публикацией |
| `published` | В публичном каталоге `/projects` |
| `active` | В реализации (сделки / этапы) |
| `completed` | Реализация завершена |
| `archived` | Скрыт из каталога, сохранён у владельца |

### Логика жизненного цикла

1. Пользователь создаёт проект — всегда `draft`.  
2. Дорабатывает описание, категорию, стадию бизнеса, сумму.  
3. Отправляет на `moderation`; публикацию подтверждает админ/модератор.  
4. В каталоге видны `published`, `active`, `completed`.  
5. Владелец переводит `published → active → completed` (или в `archived`).  
6. Активная сделка может автоматически перевести `published → active`.

UI переходов: `ProjectLifecycle` (workspace / edit).

---

## Стадии проекта

| Стадия | Смысл |
|---|---|
| `idea` | Идея |
| `startup` | Стартап |
| `operating` | Действующий бизнес |
| `expansion` | Расширение |

---

## Шаблоны проектов (этап 32)

Конфиг: `src/config/project-templates.ts`. UI: `/dashboard/projects/create?template=…`.

| id | Назначение |
|---|---|
| `new_business` | Запуск с нуля |
| `business_development` | Развитие действующего бизнеса (кейс ТИНДА) |
| `investment_project` | Привлечение капитала |
| `business_optimization` | Эффективность и KPI |

Каждый шаблон содержит: **цели**, **этапы**, **необходимые данные**, **рекомендуемые действия**, плюс секции описания. Методология сопровождения: [ckr-methodology.md](./ckr-methodology.md).

Структуры черновиков документов (без генерации файлов): `BusinessPlanDraft`, `RoadmapDraft`, `InvestmentProposalDraft` — `src/types/project-drafts.ts`.

---

## RLS

- **Владелец:** создаёт, читает, обновляет, удаляет свои проекты.  
- **Гость / другие пользователи:** читают `published` / `active` / `completed`.  
- **Admin:** полный доступ (через `is_admin`).

Категории: публичное чтение.

---

## Маршруты

| Путь | Назначение |
|---|---|
| `/projects` | Публичный каталог |
| `/project/[id]` | Страница проекта |
| `/dashboard/projects` | Мои проекты |
| `/dashboard/projects/create` | Создание |
| `/dashboard/projects/[id]/edit` | Редактирование |

---

## Миграция

`supabase/migrations/20260325140000_projects_and_categories.sql`
