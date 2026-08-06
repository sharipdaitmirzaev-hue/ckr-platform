# ТИНДА — production pilot case

Этап 42 · Версия `0.42.0-beta`  
Связано: [launch-success-framework.md](./launch-success-framework.md) · [wave-launch.md](./wave-launch.md) · [tinda-case-public.md](./tinda-case-public.md)

---

## Статус

**production_pilot_case** — живой организационный кейс на активной волне closed (Волна 1).

Не demo-only: организация, проект, workspace, CRM, сделка и участник волны ведутся в операционном контуре `/admin/launch` вместе с **целями волны**.

---

## Активная волна

| Поле | Значение |
|---|---|
| Волна | Волна 1 — Closed |
| `wave_type` | `closed` |
| Статус волны | `active` (seed) |
| Участник | owner ТИНДА → `launch_wave_participants` status `active` |

---

## Пользователи

Команда ТИНДА — участники closed wave (учёт в цели «20 участников»).

---

## Бизнес-цели (seed)

| Цель | Метрика | Target |
|---|---|---|
| Контакты клиентов ТИНДА | `business_results` | 2 |
| Переговоры ТИНДА | `business_results` | 2 |
| Партнёры ТИНДА | `business_results` | 2 |
| Сделки ТИНДА | `deals` | 1 |

Плюс общие цели волны: профили, проекты, заявки, сделка, Лия — см. миграцию `launch_goals`.

---

## Показатели

Смотреть на `/admin/launch` (LaunchMetrics · Цели волны · блок ТИНДА):

- контакты клиентов / переговоры / партнёры / сделки  
- прогресс целей (ProgressBar)  
- LaunchGoalReport в Лие  

Seed (`npm run seed:tinda`) идемпотентно обновляет участника волны; значения целей пересчитываются при открытии дашборда.

---

## Результаты

- Единая модель организация → проект → этапы → партнёры → сделка  
- Кейс закреплён как эталон волны 1 с измеримыми целями  
- Обратная связь идёт в improvement loop без расширения бизнес-модулей  

Публичная версия: [tinda-case-public.md](./tinda-case-public.md).
