# Пользовательские пути ЦКР 1.0

Этап 35 · Аудит единых сценариев закрытого пилота.

Связано: [ckr-1.0-overview.md](./ckr-1.0-overview.md) · [demo-script.md](./demo-script.md) · [lia-flows.md](./lia-flows.md)

---

## 1. Предприниматель

```text
Регистрация (/register)
  ↓
Онбординг (/onboarding) — роль, регион, профиль
  ↓
Профиль (/profile/[id], /dashboard/settings)
  ↓
Лия (/lia) — «Помоги создать бизнес-проект» / аудит / стратегия
  ↓
Создание проекта (/dashboard/projects/create, шаблоны)
  ↓
Анализ (ProjectLiaActions / /api/lia/analyze)
  ↓
Поиск решений (find_solutions, каталоги)
  ↓
Заявки (/dashboard/applications)
  ↓
Сделка (application → deal в workspace)
  ↓
Workspace (/dashboard/projects/[id]/workspace)
  — lifecycle, roadmap, KPI, progress, outcomes
  ↓
Результат (project_results, evaluate_outcome, /admin/results для оператора)
```

**Статус аудита:** путь покрыт существующими модулями. Точки внимания: пустые каталоги без демо-fallback; Лия требует авторизации для сохранения.

---

## 2. Инвестор

```text
Регистрация
  ↓
Профиль / онбординг (роль investor)
  ↓
Каталог проектов (/projects)
  ↓
Интерес («Интересно» → /dashboard/interests)
  ↓
Заявка на проект
  ↓
Сделка (после accept → negotiation)
```

Дополнительно: размещение investment offer (`/dashboard/investments/create`), каталог `/investments`.

**Статус аудита:** путь рабочий. Каталог может быть пустым вне демо/seed.

---

## 3. Эксперт

```text
Регистрация
  ↓
Профиль эксперта (/dashboard/expert/create)
  ↓
Верификация (документы / verification)
  ↓
Публикация в каталоге (/experts)
  ↓
Получение запросов (applications на expert)
```

**Статус аудита:** путь покрыт. UX: пустой каталог экспертов ведёт в кабинет (исправлено EmptyState на этапе 35).

---

## 4. Организация

```text
Создание / вход в кабинет (/partner, /partner/profile)
  ↓
Сотрудники (/partner/members)
  ↓
Проекты организации (/partner/projects)
  ↓
Предложения (/partner/offers)
  ↓
Партнёрства (partnerships в профиле org)
```

Пилот: ООО ТИНДА (`pilot.tinda@ckr.local` после seed).

**Статус аудита:** путь покрыт модулем partners. CRM организации видна оператору, не в org-cabinet целиком.

---

## 5. Оператор ЦКР

```text
Лиды (/admin/crm)
  ↓
CRM (контакты, активности, конвертация)
  ↓
Модерация (/admin/projects, opportunities, investments, experts, verifications)
  ↓
Сопровождение (/operator, workspace участника, roadmap/KPI)
  ↓
Результаты (/admin/results)
```

Staff: admin или operator_roles. Admin-only: users, invites, analytics, results.

**Статус аудита:** путь покрыт. Pilot dashboard `/admin/pilot` — сводка closed pilot.

---

## 6. Единый принцип UX

1. Один следующий шаг на экране (CTA).  
2. Лия только рекомендует.  
3. Пустые состояния с действием.  
4. Публичная карточка ≠ приватный workspace ≠ CRM.  
5. Мобильная адаптация: `Container`, стек кнопок, без горизонтального overflow в hero.

---

## 7. Критерий готовности пути 1.0

- [x] Предприниматель: от регистрации до workspace/результата  
- [x] Инвестор: каталог → интерес → заявка → сделка  
- [x] Эксперт: профиль → верификация → заявки  
- [x] Организация: partner cabinet  
- [x] Оператор: CRM → модерация → results  
- [x] Документ `docs/user-flows.md`
