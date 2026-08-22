# UX Simplification B — BALANCED

Presentation-only simplification. Backend, routes, and tables unchanged. Production not deployed.

## What changed

- Client primary nav: Главная · Обращения · Возможности · Компания? · Профиль + **+ Новое обращение**
- Power tools under **Ещё / Инструменты** (ADVANCED)
- Client Home answers: что делает ЦКР / что найдено / что от вас
- Opportunities hub tabs: Для вас | Сохранённые | Все
- Operator primary: Главная · Заявки · Компании · Возможности · Поиск · Задачи
- System tools under **Ещё → Система** (OI, publish, graph, feed diag, stage archives…)
- Company: 5 primary tabs; requisites deeper
- Human status / CTA vocabulary via `src/config/ux-simplification.ts`
- Mobile shells for client and operator

## Tests

```bash
npm run test:ckr-ux-simplification-b
```
