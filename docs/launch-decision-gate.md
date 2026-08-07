# Launch Decision Gate

Этап 45 · Версия `0.45.0-beta`  
UI: `/admin/launch-decision` · Кейс: [tinda-decision-report.md](./tinda-decision-report.md)  
Предшественник: [closed-wave-review.md](./closed-wave-review.md)

Новые бизнес-модули не добавляются. Цель — принять решение о дальнейшем развитии ЦКР после Closed Wave 1.

---

## Критерии перехода

| Решение | Когда |
|---|---|
| `needs_improvement` | Critical/High открыты или прогресс целей волны низкий |
| `continue_closed` | Волна полезна, но цели/UX ещё не стабильны — остаёмся в closed |
| `expand_beta` | Цели Closed Wave в основном закрыты, нет Critical; готовы к экосистемной Wave 2 |
| `public_launch_ready` | Wave 2 стабилизирована, есть связи/сделки, Critical закрыты |

Рекомендация системы на дашборде **не заменяет** решение оператора. Фиксация пишется в `launch_decisions`.

---

## Когда расширять beta

Расширять (`expand_beta` → Launch Wave 2), если:

1. Closed Wave 1 дала измеримую ценность (цели, UX-путь, сделки/CRM).  
2. Critical improvements закрыты или явно отложены с риском.  
3. Готовы набрать когорту: предприниматели + эксперты + инвесторы.  
4. Цель волны — **взаимодействие экосистемы**, не один проект.

Тип Wave 2: `closed` или `beta` (по решению Gate).

---

## Когда открывать public

Готовить public (`public_launch_ready` → Wave 3), если:

1. Wave 2 показала связи, сделки и партнёрства между ролями.  
2. Нет открытых Critical/High блокеров запуска.  
3. Help center, чеклист public и onboarding готовы.  
4. Оператор подтвердил Go на Decision Gate.

До public не открывать каталог «всем» — только waitlist / ограниченный контур.

---

## Артефакты

- `LaunchDecisionReport` — summary, wave_results, goal_completion, business_value, product_readiness, critical_risks, recommendation, next_step  
- `LaunchDecisionAIReport` — анализ Лии (strengths / weaknesses / risks / recommendation)  
- Таблица `launch_decisions` — журнал решений  
- Seed **Launch Wave 2** + цели пользователей / активности / результатов  

---

## Как пользоваться

1. Откройте `/admin/wave-review` — сверка фактов волны.  
2. Откройте `/admin/launch-decision` — отчёт, triage улучшений, Wave 2.  
3. Закройте Critical/High в `/admin/improvements` при необходимости.  
4. Зафиксируйте решение формой на странице Gate.  
5. Дополнительно: Лия «Готов ли ЦКР к следующей волне?» → `LaunchDecisionAIReport`.
