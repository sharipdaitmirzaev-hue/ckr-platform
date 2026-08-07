# Partnership Network

Этап 62 · Версия `0.62.0-beta`  
UI: `/admin/partnerships` · кабинет `/partner` · Лия: «Как развивается партнёрская сеть ЦКР?»

Связано: [growth-engine.md](./growth-engine.md) · [initial-partner-strategy.md](./initial-partner-strategy.md) · [project-acquisition-engine.md](./project-acquisition-engine.md)

---

## Цель

Создать сеть, которая постоянно приводит в ЦКР проекты, людей и ресурсы:

- поиск партнёров;
- учёт партнёрских отношений;
- привлечение проектов через партнёров;
- измерение результата партнёрств.

**Без отдельной системы партнёров.** Используются `organizations`, `organization_members`, `partnerships`, CRM, analytics, growth_engine.

---

## Модель

| Сущность | Роль |
|---|---|
| `organizations` | Карточка партнёра (тип, описание, контакт) |
| `partnerships` | Отношение + `pipeline_stage` + ответственный |
| `partnership_tasks` | Операционные задачи сети |
| CRM `partner` | Контакты и лиды |
| analytics `source=partner` | Attribution |

---

## Типы партнёров (поверх organization.type)

- бизнес-объединение (`association`);
- банк (`bank`);
- инвестиционная организация (`fund`);
- образовательная организация (`university`);
- консалтинг / прочее (`other`);
- производственная компания (`company`);
- государственные / институциональные (`government`);
- поставщик (`supplier`).

---

## PartnershipPipeline

```
partner_found → contacted → meeting → negotiation → active → completed
```

Связь с `partnerships.status`: pending / active / inactive (синхронизируется при смене stage).

---

## Карточка партнёра

Отображает: описание, направление, контакт, статус, ответственный, дата начала, результаты (outcomes).

---

## PartnershipOutcomes

Партнёр → приведённые пользователи → проекты → эксперты → инвесторы → заявки → сделки.

---

## Attribution

Источник: `partner` для регистраций, проектов, заявок, сделок.  
Дашборд показывает, какой партнёр дал какой результат.

---

## PartnershipTasks

Типы: найти контакт · провести встречу · подготовить предложение · подписать соглашение · сопровождать партнёра.

Статусы: `new` → `in_progress` → `completed`.

---

## KPI

- активные / потенциальные / завершённые партнёры;
- конверсия pipeline;
- referrals и результаты по attribution;
- закрытие PartnershipTasks.

---

## Лия

Сценарий **«Как развивается партнёрская сеть ЦКР?»** → `PartnershipReport`

(`summary`, `partners`, `activity`, `referrals`, `results`, `problems`, `recommendations`) — только анализ.

---

## Аналитика

- `partner_created`
- `partner_contacted`
- `partner_activated`
- `partner_referral_created`
- `partner_result_created`

---

## Порядок работы

1. `/admin/partnerships` — обзор сети и pipeline.
2. Вести карточки organizations + partnerships.
3. Закрывать PartnershipTasks.
4. Трекать source=partner в привлечении.
5. Еженедельно: сценарий Лии по партнёрской сети.
