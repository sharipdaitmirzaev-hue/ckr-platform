# Монетизация ЦКР

Этап 16: основа коммерческой модели платформы.

**Принцип:** ЦКР не превращается в доску платных объявлений. Монетизация связана с созданием ценности:

- доступ к возможностям;
- сопровождение проектов;
- успешные сделки;
- профессиональные услуги.

Миграция: `supabase/migrations/20260325260000_monetization.sql`.

---

## 1. Тарифы (`subscription_plans`)

| Поле | Описание |
|---|---|
| `name` | Название |
| `type` | Тип тарифа |
| `description` | Описание ценности |
| `price` | Цена |
| `period` | `month` · `year` · `once` |
| `features` | JSON-массив возможностей |
| `status` | `active` · `inactive` |

**Типы:** `investor` · `company` · `expert` · `enterprise`

Публичное чтение активных планов. Управление — admin (RLS).

Страница: `/pricing` · компонент `PricingCard`.

---

## 2. Подписки (`subscriptions`)

| Поле | Описание |
|---|---|
| `user_id` | Пользователь |
| `plan_id` | Тариф |
| `status` | Статус |
| `started_at` | Начало |
| `expires_at` | Окончание (nullable) |

**Статусы:** `active` · `expired` · `cancelled`

Пользователь видит свои подписки; admin — все.

Кабинет: `/dashboard/billing` · бейдж `SubscriptionBadge`.

---

## 3. Услуги ЦКР (`services`)

| Поле | Описание |
|---|---|
| `title` | Название |
| `description` | Описание |
| `category` | Категория |
| `price` | Цена |
| `status` | `active` · `inactive` |

**Категории:**

- `business_plan`
- `legal`
- `marketing`
- `consulting`
- `investment_search`
- `project_support`

Страница: `/services` · компонент `ServiceCard`.

---

## 4. Комиссия по сделкам (`deals`)

Расширение таблицы `deals`:

| Поле | Описание |
|---|---|
| `commission_type` | `fixed` · `percent` |
| `commission_amount` | Сумма или процент |
| `commission_status` | `pending` · `paid` · `cancelled` |

Комиссия отражает ценность сопровождения успешной сделки, а не плату за размещение карточки.

Отображение: `DealCard` в кабинете проекта.

---

## 5. UI

| URL | Назначение |
|---|---|
| `/pricing` | Публичные тарифы |
| `/services` | Каталог услуг ЦКР |
| `/dashboard/billing` | Подписка, запросы на оплату и услуги |

Компоненты:

- `components/billing/pricing-card.tsx`
- `components/billing/service-card.tsx`
- `components/billing/subscription-badge.tsx`

Конфиг и fallback: `src/config/monetization.ts`.

---

## 6. Платёжная архитектура

Реальные платежи **не подключены**.

Интерфейс: `src/lib/payments/types.ts` → `PaymentProvider`.

| Возможность | Статус |
|---|---|
| Банковская карта | контракт + mock |
| СБП | контракт + mock |
| Другие провайдеры | через фабрику `getPaymentProvider()` |

Файлы:

- `src/lib/payments/provider.ts` — фабрика (`PAYMENT_PROVIDER=mock`)
- `src/lib/payments/mock-provider.ts` — без реальных списаний
- `src/features/billing/actions.ts` — создание checkout-запроса

Позже: ЮKassa / CloudPayments / custom webhook + запись платежей в БД.

---

## 7. Связь с продуктом

```text
Подписка → доступ и приоритет
Услуга   → профессиональная помощь
Сделка   → комиссия за успешный результат
```

Лия, каталоги и кабинет проекта остаются ядром ценности; биллинг обслуживает этот путь, а не заменяет его.
