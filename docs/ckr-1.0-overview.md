# ЦКР 1.0 — обзор платформы

Версия ядра: `0.35.0-beta` (упаковка 1.0 для закрытого пилота)  
Канал: `closed-pilot`

Связано: [platform-overview.md](./platform-overview.md) · [user-flows.md](./user-flows.md) · [demo-script.md](./demo-script.md) · [roadmap-after-1.0.md](./roadmap-after-1.0.md)

---

## 1. Назначение

**ЦКР — Центр комплексных решений.**  
Цифровая бизнес-платформа, где идеи встречаются с возможностями, капиталом и экспертизой.

Логика: **Идея → Анализ → Решения → Ресурсы → Реализация.**

ЦКР не маркетплейс объявлений, а контур сопровождения проекта до результата.

---

## 2. Архитектура

| Слой | Технология |
|---|---|
| UI | Next.js 14 App Router, TypeScript, Tailwind |
| Auth / DB | Supabase Auth, Postgres, RLS, Storage |
| ИИ | Лия (`/lia`, server engine + providers) |
| Аналитика | `analytics_events`, admin analytics / results |

Модули ядра: auth, projects, opportunities, investments, experts, applications, deals/workspace, Lia, CRM, operator, partners, reputation, monetization (mock), pilot tools, project execution (roadmap/KPI), project outcomes.

Подробная карта: [platform-overview.md](./platform-overview.md).

---

## 3. Роли

| Роль | Фокус |
|---|---|
| Предприниматель | Проект, анализ, ресурсы, сделка, реализация |
| Инвестор | Каталог, интерес, заявка, сделка / оффер |
| Эксперт | Профиль, верификация, заявки |
| Организация (company) | Кабинет `/partner`, сотрудники, партнёрства |
| Оператор / Admin | CRM, модерация, сопровождение, результаты |

---

## 4. Основные сценарии

1. Создание проекта с Лией → draft → moderation → published/active.  
2. Анализ проекта и поиск решений.  
3. Заявки и сделки в workspace.  
4. Roadmap / KPI / прогресс / outcomes.  
5. Партнёрский пилот (ТИНДА).  
6. Операторский контур CRM → results.

См. [user-flows.md](./user-flows.md), [lia-flows.md](./lia-flows.md).

---

## 5. Возможности 1.0

- Публичные каталоги и ролевые лендинги  
- Лия: идея, аудит, стратегия, progress, outcome  
- Workspace: участники, сделки, milestones, roadmap, KPI, результаты  
- CRM и операторский центр  
- Партнёрская сеть и репутация  
- Closed pilot: invites, `/admin/pilot`, seed ТИНДА  
- Презентация: `/about`, `/features`, demo

---

## 6. Ограничения текущей версии

- Закрытый пилот / beta — не публичный mass-market launch.  
- Платежи: mock-провайдер.  
- Внешний поиск Лии зависит от ключей провайдера (иначе mock).  
- Нет мобильного native API как отдельного продукта (в backlog после 1.0).  
- Seed ТИНДА и demo требуют секретов и не включены в production по умолчанию.  
- Лия не выполняет необратимые действия без подтверждения.  
- Часть CRM-сегментов и org↔CRM связей — упрощённая модель пилота.

Не входит в 1.0: см. [roadmap-after-1.0.md](./roadmap-after-1.0.md).

---

## 7. Презентационный слой

| Страница | Назначение |
|---|---|
| `/` | Главный вход, бренд, путь, роли |
| `/about` | Что такое ЦКР, как работает, роли, кейс ТИНДА |
| `/features` | Функции платформы |
| `/demo` | Демо-режим |
| `/entrepreneurs`, `/investors`, `/experts` | Ролевые лендинги |

---

## 8. Критерий упаковки 1.0

- [x] Пользовательские пути задокументированы  
- [x] UX пустых состояний на ключевых каталогах  
- [x] `/about` и `/features`  
- [x] `docs/ckr-1.0-overview.md`, demo-script, roadmap-after-1.0  
- [x] version `0.35.0-beta`, README, changelog, env.example  
- [x] `npm run lint` / `npm run build`
