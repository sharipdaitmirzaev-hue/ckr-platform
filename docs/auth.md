# Auth ЦКР

Документация Этапа 1: регистрация, роли, профиль.

## Архитектура

```text
Supabase Auth (email/password)
        ↓
   auth.users
        ↓ trigger handle_new_user
   public.profiles
        ↓
   public.user_roles  (мультироль)
```

Один пользователь может иметь несколько ролей, например:

- предприниматель + инвестор;
- эксперт + предприниматель.

Роль `admin` нельзя назначить себе через клиент (RLS).

---

## Регистрация

Маршрут: `/register`

Поля:

| Поле | Описание |
|---|---|
| Email | Логин Supabase Auth |
| Пароль | Минимум 8 символов |
| Имя (`full_name`) | Пишется в `user_metadata` и в `profiles` через trigger |
| Роль | Одна роль на старте (`entrepreneur` / `investor` / `expert` / `company`) |

Поток:

1. `signUp` в Supabase Auth с `full_name` в metadata.  
2. Trigger создаёт запись в `profiles`.  
3. При наличии сессии — insert в `user_roles`.  
4. Редирект на `/onboarding`.  

Если в проекте Supabase включено подтверждение email и сессии сразу нет — пользователю показывается сообщение подтвердить почту, затем войти.

---

## Вход и выход

- `/login` — `signInWithPassword`
- `logoutAction` — `signOut`, редирект на `/login`
- `getCurrentUser()` — auth user + profile + roles

---

## Онбординг

Маршрут: `/onboarding` (только для авторизованных)

Позволяет:

- дополнить профиль (компания, сайт, соцсети, город, регион, телефон, bio);
- выбрать **несколько** ролей.

После сохранения — редирект в `/dashboard`.

---

## Структура профиля (`profiles`)

| Колонка | Тип | Описание |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `full_name` | text | Имя |
| `company_name` | text | Компания |
| `website` | text | Сайт (Этап 6) |
| `social_links` | jsonb | Соцсети (Этап 6) |
| `verification_status` | enum | Проверка: unverified / pending / verified (Этап 6) |
| `avatar_url` | text | Аватар (позже Storage) |
| `bio` | text | О себе |
| `phone` | text | Телефон |
| `city` | text | Город |
| `region` | text | Регион |
| `created_at` | timestamptz | Создание |
| `updated_at` | timestamptz | Обновление (trigger) |

---

## Роли (`user_roles`)

| Колонка | Тип |
|---|---|
| `id` | uuid PK |
| `user_id` | uuid → profiles.id |
| `role` | enum `user_role` |
| `created_at` | timestamptz |

Значения enum:

- `entrepreneur`
- `investor`
- `expert`
- `company`
- `admin`

Ограничение: unique `(user_id, role)`.

---

## RLS

### profiles
- `select` / `update` — только свой профиль (или admin)
- публичное чтение профилей — **не открыто** (будет позже)
- `insert` — только через security definer trigger

### user_roles
- `select` — свои роли (или admin)
- `insert` / `delete` — свои роли, кроме `admin`
- admin может управлять всеми ролями

---

## Защита маршрутов

Middleware (`src/middleware.ts`):

- `/dashboard/*`, `/onboarding` — только авторизованные;
- `/login`, `/register` — редирект в кабинет, если уже вошли.

Дополнительная проверка в `(dashboard)/layout.tsx` через `getCurrentUser()`.

---

## Переменные окружения

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# опционально для сервисных задач
SUPABASE_SERVICE_ROLE_KEY=
```

Скопируйте `.env.example` → `.env.local`.

---

## Применение миграции

Файл:

`supabase/migrations/20260325120000_profiles_and_roles.sql`

Варианты:

1. Supabase CLI: `supabase db push` / `supabase migration up`
2. SQL Editor в Dashboard — выполнить содержимое файла

После применения проверьте Auth → Users и таблицы `profiles`, `user_roles`.

---

## Ключевые файлы приложения

| Файл | Назначение |
|---|---|
| `src/lib/supabase/*` | Clients + session middleware helper |
| `src/lib/auth/get-current-user.ts` | Текущий пользователь |
| `src/features/auth/actions.ts` | register / login / logout / onboarding |
| `src/app/(auth)/login` | Вход |
| `src/app/(auth)/register` | Регистрация |
| `src/app/(auth)/onboarding` | Профиль и мультироли |
| `src/middleware.ts` | Защита маршрутов |
