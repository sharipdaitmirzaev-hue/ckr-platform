# ТИНДА — production pilot case

Этап 41 · Версия `0.41.0-beta`  
Связано: [wave-launch.md](./wave-launch.md) · [tinda-case-public.md](./tinda-case-public.md)

---

## Статус

**production_pilot_case** — живой организационный кейс на активной волне closed (Волна 1).

Не demo-only: организация, проект, workspace, CRM, сделка и участник волны ведутся в операционном контуре `/admin/launch`.

---

## Активная волна

| Поле | Значение |
|---|---|
| Волна | Волна 1 — Closed |
| `wave_type` | `closed` |
| Статус волны | `active` (seed) |
| Участник | owner ТИНДА → `launch_wave_participants` status `active` |

---

## Показатели

Смотреть на `/admin/launch` (блок ТИНДА + LaunchReport):

- проекты / активность волны  
- использование Лии  
- сделки  
- участники кейса  

Seed (`npm run seed:tinda`, meta v5) идемпотентно обновляет участника волны.

---

## Результаты

- Единая модель организация → проект → этапы → партнёры → сделка  
- Кейс закреплён как эталон волны 1 для критериев перехода к public  
- Обратная связь идёт в improvement loop без расширения бизнес-модулей  

Публичная версия для внешней коммуникации: [tinda-case-public.md](./tinda-case-public.md).
