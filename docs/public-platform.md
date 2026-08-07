# Публичная платформа ЦКР

Этап 15: публичная часть и первый пользовательский опыт.

**Цель:** за ~30 секунд новый пользователь понимает, что такое ЦКР, какую пользу получает и какое действие сделать первым.

---

## Главная `/`

Hero (одна композиция):

- бренд: **ЦКР — Центр комплексных решений**
- слоган: **Партнёрство. Надёжность. Результат.**
- смысл: *Платформа, где идеи встречаются с возможностями и капиталом.*
- CTA: Создать проект с Лией · Найти проект · Найти инвестиции

Блоки ниже:

1. Как работает ЦКР  
2. Для предпринимателей / инвесторов / экспертов  
3. Возможности (превью каталога)  
4. Проекты (превью каталога)  
5. Преимущества ЦКР  
6. Финальный CTA  

Стиль: тёмно-синяя палитра (`#071522`), золотой акцент (`#C9A227`), Manrope + Onest.

---

## Страницы ролей

| URL | Назначение |
|---|---|
| `/entrepreneurs` | Предприниматели: проблема → решение → преимущества → CTA |
| `/investors` | Инвесторы |
| `/experts` | Эксперты (маркетинг + каталог `#catalog`) |

Компонент: `RoleLanding` · контент: `src/config/public-landing.ts`

---

## Публичные профили `/profile/[id]`

Показывает:

- имя, роли, компания, описание;
- проекты и возможности (published);
- экспертизу (если есть published `expert_profiles`);
- статус проверки.

### Приватность

Миграция `20260325250000_public_profiles_privacy.sql`:

- `profiles.is_public` (default true)
- `profiles.show_contact` (телефон на публичной странице)

RLS:

- `profiles_select_public` — anon/authenticated читают публичные незаблокированные профили;
- `user_roles_select_public_profile` — роли (кроме admin) для публичных профилей.

Настройки: чекбоксы в онбординге `/onboarding`.

---

## SEO

| Файл | Содержание |
|---|---|
| `src/app/layout.tsx` | metadata, OpenGraph, Twitter, keywords |
| `src/app/sitemap.ts` | статичные публичные URL |
| `src/app/robots.ts` | allow public / disallow dashboard, admin, api |
| Страницы | `metadata` + `alternates.canonical` + OG |

Красивые URL: `/entrepreneurs`, `/investors`, `/experts`, `/profile/[id]`, каталоги без query где возможно.

Переменная: `NEXT_PUBLIC_SITE_URL` для canonical и sitemap.

---

## Ключевые файлы

| Путь | Назначение |
|---|---|
| `src/app/(public)/page.tsx` | Главная |
| `src/app/(public)/entrepreneurs/page.tsx` | Роль |
| `src/app/(public)/investors/page.tsx` | Роль |
| `src/app/(public)/experts/page.tsx` | Роль + каталог |
| `src/app/(public)/profile/[id]/page.tsx` | Публичный профиль |
| `src/lib/profiles/queries.ts` | Данные профиля |
| `src/components/marketing/role-landing.tsx` | Шаблон роли |
| `src/config/brand.ts` | promise, advantages |
