# Репутация и доверие ЦКР

Этап 24: система оценки опыта и доверия участников платформы.

Публичный профиль: `/profile/[id]`.

---

## 1. Репутационные профили — `reputation_profiles`

| Поле | Описание |
|---|---|
| entity_type | `user` · `organization` |
| entity_id | UUID сущности |
| score | Средний рейтинг отзывов (0–5) |
| verification_level | `basic` · `verified` · `trusted` |
| completed_projects | Опубликованные проекты |
| completed_deals | Завершённые сделки |
| reviews_count | Число отзывов |
| created_at / updated_at | Метки времени |

Уникальность: `(entity_type, entity_id)`.

Уровень доверия выводится из фактов верификации и активности (`deriveVerificationLevel` в `src/config/reputation.ts`) — это ориентир, не вердикт.

---

## 2. Отзывы — `reviews`

| Поле | Описание |
|---|---|
| author_id | Автор (profiles) |
| target_type | `project` · `organization` · `expert` · `investor` · `service` |
| target_id | UUID цели |
| deal_id | Связанная сделка (nullable) |
| rating | 1–5 |
| comment | Текст |
| created_at | Дата |

Один автор — один отзыв на пару `(target_type, target_id)`.

---

## 3. История участия — `entity_history`

Виды (`kind`):

- `project` — проекты
- `deal` — сделки
- `partnership` — партнёрства
- `task` — завершённые задачи / этапы

Запись создаётся при завершении сделки, этапа проекта и создании партнёрства.

---

## 4. Публичные профили

На `/profile/[id]` показываются:

- рейтинг и уровень доверия;
- бейджи;
- отзывы + форма отзыва (для авторизованных);
- история участия;
- опубликованные проекты.

---

## 5. Бейджи — `trust_badges`

| Код | Смысл |
|---|---|
| verified | Профиль/документы проверены ЦКР |
| trusted_partner | Надёжный партнёр экосистемы |
| experienced_investor | Инвестор с завершёнными сделками |
| ckr_expert | Эксперт ЦКР с подтверждённой практикой |

Авто-выдача (себе): `verified`, `experienced_investor` при синхронизации профиля.  
Ручная выдача остальных — администратор (`awardTrustBadgeAction`).

---

## 6. Лия: «Проверь надёжность участника»

Сценарий: `check_reliability`

Показывает:

- факты (рейтинг, сделки, проекты, бейджи);
- сводку по документам;
- историю участия;
- ориентир без окончательного решения.

Контракт: `src/lib/reputation/check-reliability.ts`  
Конфиг: `src/config/lia.ts`  
Движок: `src/lib/lia/engine.ts`

Пример запроса: «Проверь надёжность участника id: &lt;uuid&gt;».

---

## 7. RLS

- `reputation_profiles` — публичное чтение; insert/update — admin или владелец (user)
- `reviews` — публичное чтение; insert — автор; update/delete — автор или admin
- `entity_history` — публичное чтение; insert — admin / operator / владелец user
- `trust_badges` — публичное чтение; self-insert для auto-бейджей; полный доступ — admin

---

## 8. Код

| Слой | Путь |
|---|---|
| Миграция | `supabase/migrations/20260325330000_reputation.sql` |
| Конфиг | `src/config/reputation.ts` |
| Queries / sync | `src/lib/reputation/*` |
| Actions | `src/features/reputation/actions.ts` |
| UI | `src/components/reputation/*`, `/profile/[id]` |
| Документация | `docs/reputation.md` |
