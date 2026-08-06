# Public Marketplace Layer

Этап 48 · Версия `0.48.0-beta`  
Публичный интерфейс уже созданной платформы ЦКР — не новый продукт.

Связано: [public-platform.md](./public-platform.md) · [ecosystem-beta.md](./ecosystem-beta.md) · [tinda-case-public.md](./tinda-case-public.md)

---

## Структура публичной части

| Маршрут | Назначение |
|---|---|
| `/` | Hero, как работает, роли, каталоги, кейс ТИНДА, вход в Лию |
| `/projects` | Каталог проектов: поиск, отрасль, регион, стадия, статус |
| `/project/[id]` | Публичная презентация проекта + CTA |
| `/opportunities` | Ресурсы / партнёрства / предложения |
| `/investments` | Капитал: отрасль, сумма, тип участия |
| `/experts` | Каталог экспертов: направление, регион, опыт |
| `/expert/[id]` | Карточка эксперта |
| `/entrepreneur` `/investor` `/expert` `/organization` | Ролевые лендинги |
| `/how-it-works` | Что такое ЦКР, Лия, проекты, ресурсы, сделки |
| `/cases` | Публичные кейсы (ТИНДА) |
| `/about` | О платформе |
| `/lia` | Публичная Лия |

Внутренние модули (dashboard, admin, partner, deals, workspace) без изменений контракта.

---

## Пользовательские сценарии

1. **Идея → проект** — Лия / регистрация → карточка в `/projects`.  
2. **Нужен ресурс** — `/opportunities` → заявка.  
3. **Инвестиции** — `/investments` или интерес к `/project/[id]`.  
4. **Экспертиза** — `/experts` → связаться / заявка.  
5. **Организация** — `/organization` → `/partner` и проекты компании.

До регистрации Лия даёт консультацию; после — помогает создавать объекты.

---

## Связь с внутренними модулями

```text
Публичные каталоги
    ↓ applications / interests
Кабинет (dashboard) + сделки / workspace
    ↓
Организации (partner) · Launch waves · Ecosystem analytics
```

Сущности те же: `projects`, `opportunities`, `experts`, `investment_offers`, `organizations`, `profiles`, `applications`, `lia`.

---

## SEO и доверие

- metadata / Open Graph на ключевых страницах  
- `sitemap.ts`, `robots.ts`  
- кейсы и about для доверия B2B  

Стиль: серьёзная деловая платформа ЦКР (тёмно-синий / золото), не социальная лента.
