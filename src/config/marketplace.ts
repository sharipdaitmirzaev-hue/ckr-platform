/** Публичный Marketplace Layer (этап 48) + packaging (этап 65). */

export const MARKETPLACE_HERO = {
  /** Brand-level signal — имя платформы в hero. */
  brandTitle: "ЦКР — Центр комплексных решений",
  title: "ЦКР — Центр комплексных решений",
  description:
    "Помогаем предпринимателям развивать проекты, находить решения, экспертов, партнёров и ресурсы.",
  ctas: [
    {
      label: "Получить аудит бизнеса",
      href: "/lia?scenario=business_audit",
    },
    {
      label: "Разместить проект",
      href: "/register?next=/dashboard/projects/create",
    },
    {
      label: "Найти возможности",
      href: "/opportunities",
    },
  ],
} as const;

/** Полный путь «Как работает ЦКР» на главной. */
export const MARKETPLACE_JOURNEY = [
  "Идея",
  "Анализ Лии",
  "Проект",
  "Ресурсы",
  "Партнёры",
  "Реализация",
] as const;

export const MARKETPLACE_ROLE_CARDS = [
  {
    key: "entrepreneur",
    label: "Предприниматель",
    href: "/entrepreneur",
    text: "Идея → анализ → проект → эксперты → партнёры → развитие.",
  },
  {
    key: "investor",
    label: "Инвестор",
    href: "/investor",
    text: "Проекты, возможности, аналитика и интересы в одном контуре.",
  },
  {
    key: "expert",
    label: "Эксперт",
    href: "/expert",
    text: "Компетенции, репутация и участие в реальных проектах.",
  },
  {
    key: "organization",
    label: "Организация",
    href: "/organization",
    text: "Партнёрство, проекты компании и возможности экосистемы.",
  },
] as const;

export const TINDA_PUBLIC_CASE = {
  title: "ТИНДА — первый проект развития через ЦКР",
  summary:
    "ООО ТИНДА использует ЦКР как контур развития оптовой платформы: от идеи и анализа до стратегии и реализации.",
  path: [
    "Задача",
    "Исходная ситуация",
    "Что сделал ЦКР",
    "Результаты",
    "Следующие шаги",
  ] as const,
  href: "/cases",
} as const;

/** Первый вход через Лию — главные публичные промпты. */
export const PUBLIC_LIA_PROMPTS = [
  {
    label: "Описать ситуацию для аудита",
    href:
      "/lia?scenario=business_audit&message=" +
      encodeURIComponent("Аудит моего бизнеса"),
  },
  {
    label: "У меня есть идея",
    href:
      "/lia?scenario=business_idea&message=" +
      encodeURIComponent("У меня есть идея"),
  },
  {
    label: "Мне нужен ресурс",
    href:
      "/lia?scenario=find_property&message=" +
      encodeURIComponent("Мне нужен ресурс"),
  },
  {
    label: "Я ищу инвестиции",
    href:
      "/lia?scenario=find_investments&message=" +
      encodeURIComponent("Я ищу инвестиции"),
  },
] as const;

export const HOW_IT_WORKS_SECTIONS = [
  {
    title: "Что такое ЦКР",
    text: "ЦКР — цифровая бизнес-платформа, где предприниматели, инвесторы, эксперты и организации работают в одной экосистеме: от идеи до реализации.",
  },
  {
    title: "Как работает Лия",
    text: "Лия — главный вход для посетителя: опишите ситуацию → вопросы → BusinessAuditReport → следующий шаг. Лия рекомендует, но не действует без подтверждения.",
  },
  {
    title: "Как создаются проекты",
    text: "Проект — центральная сущность. Его можно оформить вручную или со сценарием Лии: идея, регион, ресурсы, стадия — затем публикация в каталоге.",
  },
  {
    title: "Как находятся ресурсы",
    text: "В каталогах возможностей, инвестиций и экспертов. Заявки и интересы связывают участников без выхода из платформы.",
  },
  {
    title: "Как появляются сделки",
    text: "Принятая заявка переходит в сделку и workspace: этапы, коммуникации и результат фиксируются в контуре ЦКР.",
  },
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Ситуация",
    text: "Опишите задачу или бизнес Лие — без длинных форм.",
  },
  {
    step: "02",
    title: "Аудит Лии",
    text: "Лия задаёт вопросы и собирает BusinessAuditReport.",
  },
  {
    step: "03",
    title: "Проект",
    text: "Оформите проект развития или новую идею в каталоге.",
  },
  {
    step: "04",
    title: "Ресурсы",
    text: "Найдите возможности, капитал и экспертизу.",
  },
  {
    step: "05",
    title: "Партнёры",
    text: "Отправьте заявки и соберите команду реализации.",
  },
  {
    step: "06",
    title: "Развитие",
    text: "Ведите сделки и этапы до измеримого результата.",
  },
] as const;
