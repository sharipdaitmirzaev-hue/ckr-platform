# Потоки Лии ЦКР

Единая точка входа: `/lia` (+ виджет в кабинетах).

Лия **только рекомендует** и не выполняет необратимые действия без подтверждения пользователя.

---

## 1. Сценарии чата

| id | Кнопка / prompt | Результат |
|---|---|---|
| `business_idea` | Помоги создать бизнес-проект | Вопросы → `ProjectDraft` → подтверждение → проект `draft` |
| `find_investments` | Найди инвестиционные предложения | Подбор из каталога |
| `find_property` | Найди землю или помещение | Opportunities land/premises |
| `find_expert` | Подбери эксперта | Каталог экспертов |
| `solution` | Собери комплексное решение | Каталожная сборка + ориентиры |
| `realize_project` | Помоги реализовать проект | Сопровождение workspace / next steps |
| `org_find_projects` | Найди проекты для организации | Подбор для `/partner` |
| `org_offer_opportunities` | Какие возможности мы можем предложить | Рекомендации публикаций org |
| `check_reliability` | Проверь надёжность участника | Факты/документы/история **без вердикта** |

Конфиг: `src/config/lia.ts`  
Движок: `src/lib/lia/engine.ts`

---

## 2. Анализ проекта (вне чата)

| Режим | API / UI | Описание |
|---|---|---|
| analyze | `/api/lia/analyze` mode=analyze | `SolutionDraft` по проекту |
| find_solutions | mode=find_solutions | + internal/external search → `SolutionReport` |

UI: `ProjectLiaActions` на edit/workspace/public project.

---

## 3. Рекомендации пользователя

`buildLiaRecommendations(userId)` на `/dashboard`:

- черновики → доработать / на модерацию;
- опубликованные → найти ресурсы / реализовать;
- заявки и активность → следующий шаг.

---

## 4. Рекомендации оператора

Контур CRM / operator:

- подсказки по лидам и очереди (`src/lib/crm/lia-operator.ts`);
- не создают заявки и задачи автоматически.

---

## 5. Пользовательские пути

```text
Идея → business_idea → draft project
     → analyze / find_solutions
     → moderation → published
     → заявки / инвестиции / эксперты
     → realize_project + deals/milestones → active → completed
```

```text
Организация → org_find_projects / org_offer_opportunities → /partner
```

```text
Проверка участника → check_reliability → /profile/[id]
```

---

## 6. Ограничения

- Нет автосоздания заявок, сделок, публикаций.
- Внешние источники помечены как непроверенные.
- Приватные документы не уходят во внешние модели.
- Disclaimer: `LIA_DISCLAIMER` / reputation disclaimer.

Подробнее: [lia.md](./lia.md), [project-flow.md](./project-flow.md), [lia-solutions.md](./lia-solutions.md), [reputation.md](./reputation.md).
