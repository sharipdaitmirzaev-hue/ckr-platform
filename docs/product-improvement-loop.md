# Цикл улучшения продукта ЦКР

Этап 37: улучшения на данных закрытого пилота.  
Версия: `0.37.0-beta` · Связано: [pilot-operations.md](./pilot-operations.md) · [tinda-pilot-review.md](./tinda-pilot-review.md) · [closed-pilot.md](./closed-pilot.md)

Новые бизнес-модули **не добавляются**. Используются: `feedback`, `pilot_issues`, `analytics_events` (метрики пилота), Лия.

---

## Цель

Закрыть петлю: **наблюдение → проблема → улучшение → выпуск**, чтобы пилот реально улучшал продукт, а не копил отзывы без действия.

---

## Цепочка

```text
feedback
   ↓  (продвижение)
pilot_issues
   ↓  (продвижение)
product_improvements
   ↓
released / rejected
```

Кабинет: `/admin/improvements`.

---

## Сущность `product_improvements`

| Поле | Значения |
|---|---|
| title / description | текст |
| source_type | `feedback` · `pilot_issue` · `analytics` · `lia` · `manual` |
| source_id | uuid источника (опционально) |
| priority | `critical` · `high` · `medium` · `low` |
| status | `planned` · `in_progress` · `released` · `rejected` |

`pilot_issues` дополнительно хранит `source_type` / `source_id` (например, из feedback).

---

## Источники данных

| Источник | Использование |
|---|---|
| `feedback` | предложения, баги, UX, business_value, lia_quality |
| `pilot_issues` | операционные проблемы пилота |
| `analytics_events` | метрики воронки / «pilot metrics» |
| Лия | сценарий «Что улучшить в ЦКР?» → `ProductImprovementReport` |

---

## Процесс оператора

1. Собрать feedback (категория + приоритет).  
2. Критичное / повторяющееся → **В проблему** (`pilot_issues`).  
3. Подтверждённую проблему → **В улучшения** (`product_improvements`).  
4. Вести статус: `planned` → `in_progress` → `released` (или `rejected`).  
5. Раз в спринт запускать Лию: «Что улучшить в ЦКР?» (только анализ).  
6. Сверять воронку `/admin/pilot/report` и прогресс ТИНДА.

---

## Лия

Сценарий: **«Что улучшить в ЦКР?»** (`product_improvement`).

Отчёт `ProductImprovementReport`:

- `summary`
- `main_problems`
- `patterns`
- `recommendations`
- `priority_actions`

Лия **не создаёт** записи улучшений автоматически.

---

## Критерии здорового цикла

- Есть продвижение по цепочке (не только сырой feedback).  
- Critical/high не висят без `product_improvements` дольше спринта.  
- Есть `released` по итогам пилота (хотя бы UX/багфиксы текущего контура).  
- Выводы ТИНДА зафиксированы в [tinda-pilot-review.md](./tinda-pilot-review.md).
