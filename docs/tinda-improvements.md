# Улучшения ЦКР по итогам пилота ТИНДА

Этап 31 · Версия `0.31.0-beta`  
Связано: [tinda-case-study.md](./tinda-case-study.md) · [tinda-pilot.md](./tinda-pilot.md)

Новые крупные модули **не добавлялись** — точечные шаблоны и сценарий Лии.

---

## 1. Какие функции использовались

| Функция | Статус в пилоте |
|---|---|
| Организации / `/partner` | ✅ использовано |
| Проекты (карточка, active) | ✅ |
| Анализ Лии (project analyze) | ✅ (seed + структура отчёта) |
| Workspace milestones | ✅ |
| Сделки / participants | ✅ (пилотная negotiation) |
| CRM contacts + leads | ✅ |
| Partnerships | ✅ |
| Analytics / pilot metrics | ✅ |
| Reputation org profile | ✅ |
| Pilot Dashboard `/admin/pilot` | ✅ |
| Заявки applications | ◐ частично (контур готов, не был ядром пилота) |
| Интересы инвестора | ◐ не в фокусе кейса |
| Документы / верификация | ◐ профиль verified через seed |
| Монетизация / billing | ❌ не использовалось |

---

## 2. Какие функции не использовались (и почему)

| Функция | Почему не в ядре пилота |
|---|---|
| Публичный каталог продаж | Фокус на внутреннем контуре организации |
| Investment offers matching | Капитал зафиксирован как потребность, не как live-подбор |
| Expert marketplace | Нужен на следующем шаге масштабирования |
| Messages / чат по заявке | Не было внешней стороны сделки |
| Product tests / beta invites UI | Инфраструктура пилота уже через seed + invite |
| Solutions marketing page | Не отражает реальный путь через Лию |

---

## 3. Какие нужны (приоритет)

### P0 — закрыто в этапе 31

1. **Шаблон `business_development`** — структура описания развития бизнеса.  
2. **Лия: «Аудит бизнеса»** — вопросы → `BusinessAuditReport` (SWOT + next steps).  
3. **CRM-шаблоны** `customers` / `suppliers` / `partners`.  

### P1 — следующий closed pilot цикл

4. Связь CRM ↔ `organization_id`.  
5. Создание milestones из `next_steps` / audit report.  
6. Сводка org в `/partner` (проект + CRM-сегменты + сделки).  

### P2 — open beta

7. Наполнение каталога trade / ДВ.  
8. Улучшение find_solutions под operating-бизнес.  
9. Pilot checklist UI в `/admin/pilot`.  

---

## 4. Реализация этапа 31 (код)

| Артефакт | Путь |
|---|---|
| Шаблон проекта | `src/config/project-templates.ts` · UI create `?template=business_development` |
| Аудит Лии | `src/config/lia.ts` · `src/lib/lia/engine.ts` · `BusinessAuditReport` |
| UI отчёта | `src/components/lia/business-audit-report.tsx` |
| CRM templates | `src/config/crm-templates.ts` · `/admin/crm` |
| Case study | `docs/tinda-case-study.md` |

---

## 5. Критерии успеха улучшений

- Новый кейс «как ТИНДА» можно стартовать через **Аудит бизнеса** → шаблон проекта → CRM-шаблоны без ручной сборки структуры.  
- Оператор за минуты создаёт сегменты customers/suppliers/partners с confirm.  
- Документация кейса и пробелов зафиксирована для команды ЦКР.
