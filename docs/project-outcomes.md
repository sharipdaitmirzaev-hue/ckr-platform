# Project Outcomes — результаты и эффективность ЦКР

Этап 34 · Версия `0.34.0-beta`

Цель: измерять **результаты проектов** и **эффективность сопровождения ЦКР**. Новые крупные бизнес-модули не добавлялись.

Используются: `projects`, `project_roadmaps`, `roadmap_items`, `project_metrics`, `deals`, `analytics_events`, Лия.

Связано: [project-execution.md](./project-execution.md) · [ckr-methodology.md](./ckr-methodology.md) · [analytics.md](./analytics.md) · [tinda-pilot.md](./tinda-pilot.md)

---

## 1. Результаты проектов

### `project_results`

| Поле | Описание |
|---|---|
| result_type | `revenue` · `investment` · `partnership` · `launch` · `growth` · `cost_reduction` · `other` |
| title / description | формулировка результата |
| value / unit | числовое значение |
| achieved_at | дата достижения |
| metric_id | связь с KPI (`project_metrics`) |

Миграция: `supabase/migrations/20260325390000_project_outcomes.sql`

---

## 2. Финансовые показатели

### `project_financial_metrics`

Типы: `revenue` · `investment` · `expenses` · `profit` · `valuation`

Поля: `value`, `currency`, `period`.

---

## 3. Связь с KPI

Цепочка в UI:

```text
Цель (target_value)
  ↓
Текущее значение (current_value)
  ↓
Фактический результат (project_results.value)
```

Компонент: `KpiOutcomeChain` · панель workspace: `ProjectOutcomesPanel`.

---

## 4. Метрики эффективности ЦКР

Расчёт `getCkrEfficiencyMetrics()`:

- проектов создано / завершено / активных;
- сделок и сумма инвестиций (amount);
- партнёров (active partnerships);
- среднее время идея → запуск;
- время до первой сделки;
- % выполнения roadmap;
- % завершённых milestones;
- успешность проектов;
- среднее время сопровождения.

---

## 5. Панель `/admin/results`

Компоненты:

| Компонент | Назначение |
|---|---|
| `ResultsCard` | карточка показателя |
| `OutcomeChart` | бар-диаграмма |
| `ProjectOutcomeTable` | таблица результатов |

Навигация: пункт «Результаты» в `adminNavItems`.

---

## 6. Лия — оценка результата

Сценарий **«Оцени результат проекта»** (`evaluate_outcome`):

Анализирует KPI, roadmap, `project_results`, financial metrics, активность.

Результат — `OutcomeReport`:

- `summary`
- `achievements`
- `missed_targets`
- `risks`
- `recommendations`
- `next_steps`

**Важно:** Лия только анализирует, показатели не изменяет.

Событие: `outcome_generated`.

---

## 7. Аналитика

| event_type | Когда |
|---|---|
| `result_created` | зафиксирован результат |
| `financial_metric_updated` | обновлён финпоказатель |
| `project_completed` | завершение проекта (резерв / lifecycle) |
| `outcome_generated` | отчёт Лии по результату |

Связь: `analytics_events` · `project_activity` → `activity_feed` · notifications.

---

## 8. Пилот ТИНДА

Подготовленные KPI:

- контакты, клиенты, переговоры, партнёры, сделки, рост ассортимента.

Целевые кейсы результатов:

- подключено 50 клиентов;
- заключено 10 договоров;
- найдено 5 партнёров.

Финансы seed: investment 25 000 000 ₽ · revenue 4 500 000 ₽ / quarter.

Код: `tindaProjectResults`, `tindaFinancialMetrics` в `src/lib/pilot/tinda-seed-data.ts`.

---

## 9. Код

| Слой | Путь |
|---|---|
| Config | `src/config/outcomes.ts` |
| Types | `src/types/outcomes.ts` |
| Queries | `src/lib/outcomes/queries.ts` |
| Actions | `src/features/outcomes/actions.ts` |
| Admin | `src/app/(admin)/admin/results/page.tsx` |
| UI | `src/components/outcomes/*` |

---

## 10. Критерий этапа 34

- [x] Таблицы `project_results`, `project_financial_metrics`
- [x] Связь KPI → текущее → факт
- [x] Расчёты эффективности ЦКР
- [x] `/admin/results` + ResultsCard / OutcomeChart / ProjectOutcomeTable
- [x] Лия `evaluate_outcome` → `OutcomeReport`
- [x] Seed ТИНДА
- [x] `docs/project-outcomes.md`
- [x] `npm run lint` / `npm run build`
