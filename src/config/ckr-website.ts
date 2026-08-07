/**
 * CKR Website Build — публичный сайт (этап 66).
 * Контент поверх существующих сущностей; без новых бизнес-модулей.
 */

export const CKR_WEBSITE_HERO = {
  title: "ЦКР — Центр комплексных решений",
  description:
    "Помогаем предпринимателям развивать бизнес, находить решения, экспертов, партнёров и ресурсы.",
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

/** Блок «Как работает ЦКР» на главной. */
export const CKR_HOW_IT_WORKS = [
  {
    step: "01",
    title: "Проблема бизнеса",
    text: "Формулируем задачу: рост, ресурсы, партнёры или запуск.",
  },
  {
    step: "02",
    title: "Анализ Лии",
    text: "Лия задаёт вопросы и собирает BusinessAuditReport.",
  },
  {
    step: "03",
    title: "Стратегия",
    text: "Определяем направления развития и приоритеты.",
  },
  {
    step: "04",
    title: "Проект",
    text: "Упаковываем задачу в карточку проекта ЦКР.",
  },
  {
    step: "05",
    title: "Эксперты и партнёры",
    text: "Подключаем компетенции, возможности и организации.",
  },
  {
    step: "06",
    title: "Результат",
    text: "Сделки, этапы и измеримый итог в контуре платформы.",
  },
] as const;

export const CKR_ABOUT = {
  mission:
    "Сделать путь от бизнес-задачи до результата понятным и прозрачным: анализ, проект, эксперты, партнёры и ресурсы — в одной экосистеме.",
  idea:
    "ЦКР создан как Центр комплексных решений: не доска объявлений, а рабочий контур, где предприниматели, инвесторы, эксперты и организации встречаются вокруг реальных проектов.",
  principles: [
    {
      title: "Комплексность",
      text: "От аудита и стратегии до проекта, партнёров и результата — без разрозненных инструментов.",
    },
    {
      title: "Доверие",
      text: "Модерация, верификация, статусы и прозрачные роли участников.",
    },
    {
      title: "Рекомендации, не автодействия",
      text: "Лия подсказывает следующий шаг; решения принимает пользователь.",
    },
    {
      title: "Измеримость",
      text: "Фиксируем этапы, сделки и результаты — отдельно от планов.",
    },
  ],
  howWeWork: [
    "Посетитель описывает задачу Лие или выбирает роль",
    "Получает анализ и понятный следующий шаг",
    "Регистрируется и оформляет проект / интерес / профиль",
    "Находит экспертов, партнёров и ресурсы в marketplace",
    "Ведёт реализацию в кабинете до результата",
  ],
  roles: [
    {
      title: "Предприниматель",
      text: "Аудит, проект, эксперты и партнёры для развития бизнеса.",
      href: "/entrepreneur",
    },
    {
      title: "Инвестор",
      text: "Проекты, возможности и интересы в прозрачном контуре.",
      href: "/investor",
    },
    {
      title: "Эксперт",
      text: "Компетенции, репутация и участие в реальных проектах.",
      href: "/expert",
    },
    {
      title: "Организация",
      text: "Партнёрство, проекты компании и возможности экосистемы.",
      href: "/organization",
    },
  ],
} as const;

/** Публичные услуги: описание, аудитория, результат, CTA. */
export const CKR_SERVICE_OFFERS = [
  {
    id: "business_audit",
    label: "Аудит бизнеса",
    description:
      "Диагностика ситуации: сильные стороны, риски и следующий шаг.",
    audience: "Предпринимателям и организациям на старте роста или пилота.",
    result: "BusinessAuditReport и ясный план первого действия в ЦКР.",
    href: "/lia?scenario=business_audit",
    cta: "Получить аудит",
    category: "consulting" as const,
  },
  {
    id: "project_development",
    label: "Развитие проектов",
    description:
      "Упаковка идеи или действующего бизнеса в проект развития ЦКР.",
    audience: "Тем, кому нужно оформить проект для поиска ресурсов и партнёров.",
    result: "Карточка проекта, стадии и готовность к публикациям в каталоге.",
    href: "/services?category=business_plan",
    cta: "Развить проект",
    category: "business_plan" as const,
  },
  {
    id: "partners",
    label: "Поиск партнёров",
    description:
      "Подбор организаций и партнёров экосистемы под задачу проекта.",
    audience: "Проектам, которым нужны поставщики, каналы или совместные сделки.",
    result: "Список релевантных партнёров и заявок в контуре ЦКР.",
    href: "/services?category=marketing",
    cta: "Найти партнёров",
    category: "marketing" as const,
  },
  {
    id: "expertise",
    label: "Экспертное сопровождение",
    description:
      "Подключение экспертов и юридической поддержки к проекту.",
    audience: "Командам, которым нужна компетенция без найма штата.",
    result: "Эксперт рядом с проектом: заявки, сопровождение, репутация.",
    href: "/experts",
    cta: "Найти эксперта",
    category: "legal" as const,
  },
  {
    id: "investment",
    label: "Инвестиционное сопровождение",
    description:
      "Подбор предложений и подготовка к переговорам с инвесторами.",
    audience: "Проектам, ищущим капитал, и инвесторам, ищущим сделки.",
    result: "Интересы, заявки и прозрачный путь к сделке.",
    href: "/investments",
    cta: "К инвестициям",
    category: "investment_search" as const,
  },
  {
    id: "project_management",
    label: "Проектное управление",
    description:
      "Ведение этапов, сделок и коммуникаций до измеримого результата.",
    audience: "Организациям и предпринимателям с активным проектом.",
    result: "Workspace, roadmap и контроль прогресса в кабинете ЦКР.",
    href: "/services?category=project_support",
    cta: "Сопровождение",
    category: "project_support" as const,
  },
] as const;

export const CKR_LIA_ENTRY = {
  positioning: "Лия — интеллектуальный помощник ЦКР",
  promptLabel: "Расскажите о вашей задаче",
  promptHref:
    "/lia?scenario=business_audit&message=" +
    encodeURIComponent("Расскажите о вашей задаче: мне нужен аудит бизнеса"),
  scenarios: [
    {
      label: "Аудит бизнеса",
      href: "/lia?scenario=business_audit",
      description: "Вопросы → BusinessAuditReport → следующий шаг",
    },
    {
      label: "Развитие идеи",
      href: "/lia?scenario=business_idea",
      description: "От идеи до карточки проекта",
    },
    {
      label: "Стратегия",
      href: "/lia?scenario=develop_strategy",
      description: "Направления роста и план действий",
    },
    {
      label: "Поиск решений",
      href: "/lia?scenario=solution",
      description: "Ресурсы, капитал и эксперты вокруг задачи",
    },
  ],
} as const;

export const CKR_CONTACTS = {
  title: "Контакты ЦКР",
  description:
    "Напишите команде ЦКР: партнёрство, услуги, пилот или вопрос по платформе.",
  email: "hello@ckr.platform",
  links: [
    { label: "Лия — задать вопрос", href: "/lia?scenario=business_audit" },
    { label: "Услуги", href: "/services" },
    { label: "Кейс ТИНДА", href: "/cases" },
    { label: "Доверие", href: "/trust" },
    { label: "Регистрация", href: "/register" },
  ],
} as const;

export const CKR_CONVERSION_POINTS = [
  { id: "hero_audit", label: "Получить аудит бизнеса", href: "/lia?scenario=business_audit" },
  { id: "hero_project", label: "Разместить проект", href: "/register?next=/dashboard/projects/create" },
  { id: "hero_opportunities", label: "Найти возможности", href: "/opportunities" },
  { id: "lia_entry", label: "Расскажите о вашей задаче", href: "/lia?scenario=business_audit" },
  { id: "services", label: "Услуги ЦКР", href: "/services" },
  { id: "contacts", label: "Контакты", href: "/contacts" },
  { id: "register", label: "Регистрация", href: "/register" },
] as const;
