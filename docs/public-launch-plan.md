# Public Launch Plan ЦКР

Этап 39: план открытия доступа после анализа closed beta.  
Версия: `0.39.0-beta` · База: [beta-review.md](./beta-review.md) · [controlled-beta.md](./controlled-beta.md)

Решение по умолчанию после кода этапа 39: **Conditional Go** — открывать доступ волнами после закрытия критичных пунктов ниже. Новые бизнес-модули не входят в план запуска.

---

## Готово к запуску

- Ядро ЦКР 1.0: проекты, возможности, инвестиции, эксперты, заявки, сделки, workspace  
- Лия: сценарии от идеи до результата / пилота / beta-анализа (только рекомендации)  
- Closed access: `beta_invites` (invited → activated → completed / disabled)  
- Pilot ops + improvement loop: `/admin/pilot`, `/admin/improvements`  
- Controlled beta отчётность: `/admin/beta-report`, `/admin/beta-review`  
- ТИНДА как живой организационный case  
- Документация: about/features, user-flows, demo-script, security/production checklists  

---

## Нужно исправить

Перед расширением доступа закрыть (по данным `/admin/beta-review` и improvements):

1. **Critical/high** `pilot_issues` и feedback без `product_improvements` / `released`  
2. Шаги воронки с drop-off ≥ 40–50% (обычно профиль → Лия или объект → взаимодействие)  
3. Модули с нулевым использованием в когорте — упростить вход или убрать из первого экрана онбординга  
4. Доведение хотя бы части пользователей до «результата» (сделка / project_results / completed)  
5. Операционный ритм: кто ведёт invites, issues, improvements  

Статус пунктов обновлять на `/admin/improvements` и в Beta Review.

---

## Ограничения текущей версии

- Нет полноценных внешних платежей / юр. контура (mock monetization)  
- CRM-сегменты и часть org-операций ещё UX-ограничены  
- Внешний поиск Лии зависит от провайдера и наполнения каталога  
- Public launch = расширение invite-доступа, не «открытый интернет без контроля» в первой волне  
- Новые бизнес-направления (отдельные вертикали) **вне scope**  

---

## План открытия доступа

### Волна 0 (сейчас)

Controlled beta, invite-only, оператор ведёт `/admin/beta-review`.

### Волна 1 — расширенный closed launch

- Увеличить когорту invites (предприниматели + 1–2 инвестора/эксперта на волну)  
- Сохранить `NEXT_PUBLIC_BETA_REQUIRE_INVITE=true`  
- Еженедельный Beta Review + Lia launch_readiness  

### Волна 2 — ограниченный public

- Публичная регистрация с waitlist / кодом по запросу **или** ослабление invite для выбранных ролей  
- Мониторинг активации, критичных issues, SLA оператора  
- Freeze на новые модули; только bugfix / UX  

### Волна 3 — open public (опционально)

Только после стабильных метрик волны 2 и отсутствия critical блокеров.

---

## Метрики после запуска

| Метрика | Ориентир волны 1–2 |
|---|---|
| Активация invites | ≥ 60% |
| Профиль после регистрации | ≥ 70% |
| Первое использование Лии | ≥ 40% от профилей |
| Создание объекта | ≥ 30% от профилей |
| Взаимодействие (заявка/интерес/сделка) | ≥ 20% от создавших объект |
| Возврат (2+ дня активности) | рост week-over-week |
| Critical issues open | 0 дольше 7 дней |
| Feedback → improvement → released | непрерывный цикл |

Кабинеты мониторинга: `/admin/beta-review`, `/admin/beta-report`, `/admin/improvements`, `/admin/analytics`.
