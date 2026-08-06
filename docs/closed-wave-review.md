# Closed Wave Review — как анализировать волну

Этап 44 · Версия `0.44.0-beta`  
UI: `/admin/wave-review` · Кейс: [tinda-wave-review.md](./tinda-wave-review.md) · Цели: [launch-success-framework.md](./launch-success-framework.md)

Новые бизнес-модули не добавляются. Цель — понять реальную пользу ЦКР на первом кейсе.

---

## Как анализировать волну

1. Откройте `/admin/wave-review` (staff).  
2. Проверьте карточку **Волна**: название, период, участники, статус.  
3. Пройдите **Цели**: план / факт / % / статус.  
4. Сверьте **Активность**: Лия, проекты, задачи, CRM, заявки, сделки.  
5. Разберите **путь пользователя** и проблемы UX.  
6. Прочитайте **ClosedWaveReviewReport** и блок **Next Wave Decision**.  
7. Убедитесь, что выводы ушли в improvement loop.  
8. Дополнительно: Лия «Проанализируй результаты первой волны» → `WaveReviewReport`.

---

## Какие метрики смотреть

| Блок | Метрики |
|---|---|
| Цели | target / current / progress / status |
| Активность | lia, projects, tasks, CRM, applications, deals |
| UX-путь | регистрация → профиль → Лия → проект → действия |
| Проблемы | feedback, pilot_issues, analytics drop-offs, слабые цели |
| Ценность | roadmap, KPI, CRM, сделки, project_results |

Источники: `launch_goals`, `analytics_events`, `feedback`, `pilot_issues`, сущности ТИНДА.

---

## Как принимать решение (Next Wave Decision)

| Решение | Когда |
|---|---|
| `needs_improvement` | critical/high открыты или прогресс целей &lt; 40% |
| `continue_closed` | волна полезна, но цели/UX ещё не стабильны |
| `expand_beta` | прогресс ≥ 60%, нет critical |
| `public_ready` | прогресс ≥ 80%, есть сделки и Лия, нет failed/critical |

Решение на дашборде — **рекомендация**. Финальный Go принимает оператор.

---

## Improvement loop

```text
Проблема волны
    ↓
pilot_issue   (source analytics / wave)
    ↓
product_improvement  (source_type = pilot_issue)
```

Синхронизация запускается при открытии `/admin/wave-review` (идемпотентно по заголовку `[wave] …`).

---

## Артефакты

- `ClosedWaveReviewReport` — полный обзор волны  
- `WaveReviewReport` — анализ Лии (success / problems / patterns)  
- `docs/tinda-wave-review.md` — кейс ТИНДА  
