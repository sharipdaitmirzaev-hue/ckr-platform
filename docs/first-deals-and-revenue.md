# First Deals & Revenue

Этап 63 · Версия `0.63.0-beta`  
UI: `/admin/revenue` · `/admin/revenue-kpi` · Лия: «На чём ЦКР сейчас может заработать?»

Связано: [monetization.md](./monetization.md) · [partnership-network.md](./partnership-network.md) · [tinda-commercial-case.md](./tinda-commercial-case.md)

---

## Цель

Зафиксировать первые реальные источники коммерческой ценности ЦКР.

**Не цель:** построить бухгалтерию или подключить реальные платежи.

PaymentProvider остаётся mock. Счета и оплаты подтверждаются вручную (admin/staff).

---

## Источники дохода (RevenueSources)

| Источник | Данные |
|---|---|
| `service` | `services` |
| `deal_commission` | `deals.commission_*` |
| `subscription` | `subscriptions` + plans |
| `project_support` | услуги / сделки сопровождения |
| `partner` | attribution через organizations |

Отдельная финансовая система не создаётся.

---

## Процесс продажи (RevenuePipeline)

```
Lead → Business Audit → Service / Project → Commercial Proposal
  → Agreement → Deal → Revenue
```

Связь: CRM `leads` → проекты / услуги → `deals` → `revenue_status`.

---

## Коммерческий статус сделки

Поле `deals.revenue_status`:

`potential` → `agreed` → `invoiced` → `paid` | `cancelled`

Также отображаются: сумма, комиссия ЦКР, тип и статус комиссии (existing columns).

Миграция: `20260325570000_first_deals_revenue.sql`.

---

## Услуги ЦКР (стартовый набор)

1. Аудит бизнеса  
2. Подготовка проекта  
3. Поиск партнёров  
4. Поиск инвестиций  
5. Проектное сопровождение  
6. Юридическое / экспертное сопровождение  

Цена: фиксированная **или** по запросу (`price_on_request`).  
Окончательные цены — только решением администратора.

---

## Что требует ручного подтверждения

- `revenue_status` на сделке;
- сумма комиссии;
- перевод в `paid`;
- финальная цена услуги (если по запросу);
- любые внешние счета (вне платформы).

Лия **не** выставляет счета и **не** меняет финансовые данные.

---

## Безопасность

- `/admin/revenue*` — только staff/admin (`STAFF_ADMIN_PREFIXES`);
- блок «Коммерческий результат ЦКР» в workspace — только staff;
- публичные страницы не показывают внутреннюю экономику;
- RLS существующих таблиц сохраняется.

---

## Ограничения текущей версии

- нет автоматического биллинга;
- нет реальных платежей;
- нет автовыплат партнёрам (только PartnerRevenueMetrics);
- выручка ЦКР считается по комиссии / подпискам / зафиксированным услугам — не по полной сумме чужой сделки.
