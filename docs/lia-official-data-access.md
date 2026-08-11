# Official Data Access — ЕИС и ЕФРСБ

Stage **2C.3**: код ЦКР готов принимать официальные структурированные ответы ЕИС (SOAP/XML) и ЕФРСБ (REST/JSON).  
**Production credentials пока не требуются.** Без токена/договора используются fixtures официального формата; live-запросы не выполняются.

Связанная диагностика сети: `docs/lia-oi-stage2c2-access.md`.

---

## Архитектура в коде

| Слой | Путь | Роль |
|---|---|---|
| `ProcurementOfficialProvider` | `src/lib/lia/oi/sources/providers/eis/` | ЕИС SOAP/XML → normalize |
| `FedresursOfficialProvider` | `src/lib/lia/oi/sources/providers/fedresurs/` | ЕФРСБ REST + JWT refresh |
| Adapters | `procurement`, `auction_assets` | Official API → primary; Serper → discovery/fallback |
| Merge | `providers/merge.ts` + `dedup.ts` | один `procurement_id` / `lot_id` → одна opportunity |

Fallback:

```text
Official API (structured)
  → primary
Serper site-discovery
  → fallback / discovery
If official unavailable
  → система не падает; Serper / fixture soft-degrade
```

Каналы в UI: `OFFICIAL_API` · `SERPER_DISCOVERY` · `FIXTURE/DEMO`.

`source_confidence` официального API выше; **`opportunity_score` считается отдельно** (официальный объект ≠ автоматически выгодный).

---

## Env (server-side only, без значений в git)

### ЕИС

| Variable | Meaning |
|---|---|
| `LIA_EIS_ENABLED` | `true` — разрешить live SOAP при наличии токена |
| `LIA_EIS_TOKEN` | токен интеграции ЕИС (секрет) |
| `LIA_EIS_ENDPOINT` | SOAP endpoint (по умолчанию int getDocsIP URL) |

### ЕФРСБ

| Variable | Meaning |
|---|---|
| `LIA_FEDRESURS_ENABLED` | `true` — разрешить live REST при наличии login/password |
| `LIA_FEDRESURS_LOGIN` | логин договора (секрет) |
| `LIA_FEDRESURS_PASSWORD` | пароль (секрет) |
| `LIA_FEDRESURS_BASE_URL` | base URL REST API |

Секреты **не** логируются, **не** отдаются в Owner UI, **не** кладутся в БД.

---

## A. Что нужно получить для ЕИС

1. Право организации на интеграцию с ЕИС (44-ФЗ / 223-ФЗ) — доступ к **системе обмена информацией (СОИ)** / getDocsIP (или актуальному интеграционному контуру на дату подключения).
2. **Токен (или сертификат/учётные данные)** для SOAP-вызовов выгрузки извещений/документов.
3. Понимание, какие типы документов нужны Лии: извещения о закупке (EF/EP и аналоги), статусы, НМЦК, сроки.
4. Технический контакт / инструкция оператора ЕИС по endpoint и TLS (на части контуров — ГОСТ TLS).

## B. Где это получить

1. Личный кабинет участника / организации на **zakupki.gov.ru** (ЕИС).
2. Раздел интеграции / СОИ / «информационное взаимодействие» (название в ЛК может отличаться).
3. При необходимости — заявка через уполномоченный орган / IT-подрядчика, обслуживающего доступ организации к ЕИС.
4. Официальная документация ЕИС по интеграционным сервисам (актуальная версия XML-схем извещений).

## C. Какие credentials понадобятся

- `LIA_EIS_TOKEN` — выданный токен интеграции.
- Опционально `LIA_EIS_ENDPOINT`, если endpoint отличается от default в коде.
- `LIA_EIS_ENABLED=true` на сервере приложения (например `/etc/ckr/ckr.env`).
- Сетевой доступ с VPS ЦКР до endpoint (см. Stage 2C.2: сейчас часто TCP timeout — это отдельный инфраструктурный блокер).

## D. Что нужно для ЕФРСБ

1. **Договор** с оператором ЕФРСБ / Interfax (или иным актуальным оператором API) на доступ к REST API публикаций/торгов.
2. **Login + password** (или иной согласованный auth), из которых код получает **JWT** и делает refresh.
3. Base URL production/test API (`LIA_FEDRESURS_BASE_URL`).
4. Спецификация методов: список торгов/лотов, поля цены, статуса, организатора, сроков.

Credentials:

- `LIA_FEDRESURS_LOGIN`
- `LIA_FEDRESURS_PASSWORD`
- `LIA_FEDRESURS_ENABLED=true`
- опционально `LIA_FEDRESURS_BASE_URL`

## E. Какие данные начнут поступать после подключения

### ЕИС (закупки)

- `procurement_id` (реестровый номер)
- заказчик (`customer`)
- предмет (`subject`)
- регион
- НМЦК (`nmck`)
- дедлайн подачи заявок
- этап/статус (`procurement_stage`)
- официальный URL
- provenance **FACT**, `dataChannel=OFFICIAL_API`
- пересчёт `matching_readiness` / `data_quality_score`

### ЕФРСБ (банкротные / торговые лоты)

- `lot_id` / trade id
- описание актива
- регион
- начальная / текущая цена
- дедлайн
- статус торгов
- организатор
- официальный URL
- provenance **FACT**, `dataChannel=OFFICIAL_API`

Serper при этом остаётся discovery/fallback и **не отключается**.

---

## Owner UI

- Карточка возможности: «Официальный API ЕИС» / «Официальный API ЕФРСБ», канал, FACT vs INFERENCE.
- Official data: `CONNECTED` | `NOT_CONFIGURED` | `UNAVAILABLE`.
- `/admin/owner/lia/sources`:
  - ЕИС — credentials не настроены (пока)
  - ЕФРСБ — credentials не настроены (пока)
  - Serper — LIVE (если ключ Serper уже в production)

---

## Live-test после добавления credentials

Да, **после** внесения env на сервере и рестарта приложения можно сделать ограниченный live-test:

1. Выставить `LIA_EIS_ENABLED=true` + токен **или** `LIA_FEDRESURS_ENABLED=true` + login/password.
2. Убедиться, что с хоста приложения есть сеть до endpoint (иначе статус станет `UNAVAILABLE`, Serper продолжит работать).
3. Запустить owner-поиск по закупкам/торгам и проверить `dataChannel=OFFICIAL_API`, FACT-поля, отсутствие дублей с Serper по тому же id.
4. Не включать Matching Engine на этом этапе.

Без credentials live-test официального API **невозможен** — только fixture/integration tests (`npm run test:lia-oi-stage2c3`).

---

## Блокеры (остаются)

1. Нет production токена ЕИС / договора ЕФРСБ.
2. С сети VPS ЦКР до `zakupki.gov.ru` / части int-хостов — TCP timeout (Stage 2C.2).
3. ГИС Торги HTML с VPS недоступен; open-data путь отдельно.
4. Matching / Synthesis / Scheduler — сознательно не начаты.
