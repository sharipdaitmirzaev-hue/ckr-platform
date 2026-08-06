import { LIA_DISCLAIMER } from "@/config/lia";
import type { CkrMethodologyStage } from "@/config/methodology";
import type { SolutionReport } from "@/types/lia";
import type { RoadmapDraft } from "@/types/project-drafts";

/**
 * Фиксированные UUID пилота ООО ТИНДА (идемпотентный seed).
 * Без персональных данных сотрудников — только оргпрофиль и рабочие сущности.
 */

export const TINDA_OWNER_ID = "b0000001-0000-4000-8000-000000000001";
export const TINDA_ORG_ID = "b0000002-0000-4000-8000-000000000001";
export const TINDA_PROJECT_ID = "b0000003-0000-4000-8000-000000000001";
export const TINDA_ANALYSIS_ID = "b0000004-0000-4000-8000-000000000001";
export const TINDA_DEAL_ID = "b0000005-0000-4000-8000-000000000001";
export const TINDA_MEMBER_ID = "b0000006-0000-4000-8000-000000000001";

export const TINDA_MILESTONE_IDS = {
  prep: "b0000007-0000-4000-8000-000000000001",
  sales: "b0000007-0000-4000-8000-000000000002",
  partners: "b0000007-0000-4000-8000-000000000003",
  scale: "b0000007-0000-4000-8000-000000000004",
} as const;

export const TINDA_CRM_IDS = {
  clientA: "b0000008-0000-4000-8000-000000000001",
  clientB: "b0000008-0000-4000-8000-000000000002",
  supplierA: "b0000008-0000-4000-8000-000000000003",
  supplierB: "b0000008-0000-4000-8000-000000000004",
  partnerA: "b0000008-0000-4000-8000-000000000005",
  partnerB: "b0000008-0000-4000-8000-000000000006",
} as const;

export const TINDA_PARTNERSHIP_IDS = {
  supplier: "b0000009-0000-4000-8000-000000000001",
  strategic: "b0000009-0000-4000-8000-000000000002",
} as const;

export const TINDA_LEAD_IDS = {
  clientExpansion: "b000000a-0000-4000-8000-000000000001",
  supplierOnboard: "b000000a-0000-4000-8000-000000000002",
} as const;

/** Project Execution (этап 33) */
export const TINDA_ROADMAP_ID = "b000000b-0000-4000-8000-000000000001";

export const TINDA_ROADMAP_ITEM_IDS = {
  prep: "b000000c-0000-4000-8000-000000000001",
  sales: "b000000c-0000-4000-8000-000000000002",
  scale: "b000000c-0000-4000-8000-000000000003",
} as const;

export const TINDA_TASK_IDS = {
  assortment: "b000000d-0000-4000-8000-000000000001",
  suppliers: "b000000d-0000-4000-8000-000000000002",
  warehouse: "b000000d-0000-4000-8000-000000000003",
  findClients: "b000000d-0000-4000-8000-000000000004",
  negotiations: "b000000d-0000-4000-8000-000000000005",
  firstDeals: "b000000d-0000-4000-8000-000000000006",
  expandClients: "b000000d-0000-4000-8000-000000000007",
  newRegions: "b000000d-0000-4000-8000-000000000008",
  newCategories: "b000000d-0000-4000-8000-000000000009",
} as const;

export const TINDA_METRIC_IDS = {
  clients: "b000000e-0000-4000-8000-000000000001",
  contacts: "b000000e-0000-4000-8000-000000000002",
  partners: "b000000e-0000-4000-8000-000000000003",
  deals: "b000000e-0000-4000-8000-000000000004",
  negotiations: "b000000e-0000-4000-8000-000000000005",
  assortment: "b000000e-0000-4000-8000-000000000006",
} as const;

/** Project Outcomes (этап 34) */
export const TINDA_RESULT_IDS = {
  clients: "b000000f-0000-4000-8000-000000000001",
  deals: "b000000f-0000-4000-8000-000000000002",
  partners: "b000000f-0000-4000-8000-000000000003",
} as const;

export const TINDA_FINANCIAL_IDS = {
  investment: "b0000010-0000-4000-8000-000000000001",
  revenue: "b0000010-0000-4000-8000-000000000002",
} as const;

/** Pilot Operations (этап 36) */
export const TINDA_PARTICIPANT_ID = "b0000011-0000-4000-8000-000000000001";

export const TINDA_CHECKLIST_IDS = {
  profile: "b0000012-0000-4000-8000-000000000001",
  onboarding: "b0000012-0000-4000-8000-000000000002",
  project: "b0000012-0000-4000-8000-000000000003",
  lia: "b0000012-0000-4000-8000-000000000004",
  application: "b0000012-0000-4000-8000-000000000005",
  result: "b0000012-0000-4000-8000-000000000006",
} as const;

export const tindaPilotChecklist = [
  {
    id: TINDA_CHECKLIST_IDS.profile,
    item: "Создал профиль",
    status: "done" as const,
  },
  {
    id: TINDA_CHECKLIST_IDS.onboarding,
    item: "Прошёл онбординг",
    status: "done" as const,
  },
  {
    id: TINDA_CHECKLIST_IDS.project,
    item: "Создал проект",
    status: "done" as const,
  },
  {
    id: TINDA_CHECKLIST_IDS.lia,
    item: "Использовал Лию",
    status: "done" as const,
  },
  {
    id: TINDA_CHECKLIST_IDS.application,
    item: "Отправил заявку",
    status: "pending" as const,
  },
  {
    id: TINDA_CHECKLIST_IDS.result,
    item: "Получил результат",
    status: "pending" as const,
  },
] as const;

export const tindaSeedMeta = {
  version: 5,
  organization: "ООО ТИНДА",
  projectTitle: "Развитие оптовой платформы ТИНДА",
  note: "Production pilot case ЦКР (этап 41). Волна 1 closed. Seed без реальных ПДн.",
  caseStatus: "production_pilot_case" as const,
} as const;

export const tindaExecutionRoadmap = {
  id: TINDA_ROADMAP_ID,
  projectId: TINDA_PROJECT_ID,
  title: "Roadmap реализации оптовой платформы ТИНДА",
  description:
    "Рабочая дорожная карта: подготовка → продажи → масштабирование. Связана с milestones и задачами.",
  status: "active" as const,
};

export const tindaExecutionItems = [
  {
    id: TINDA_ROADMAP_ITEM_IDS.prep,
    title: "Подготовка",
    description: "Ассортимент, поставщики, склад — готовность к росту продаж.",
    orderNumber: 1,
    status: "completed" as const,
    milestoneId: TINDA_MILESTONE_IDS.prep,
  },
  {
    id: TINDA_ROADMAP_ITEM_IDS.sales,
    title: "Продажи",
    description: "Поиск клиентов, переговоры, первые сделки.",
    orderNumber: 2,
    status: "in_progress" as const,
    milestoneId: TINDA_MILESTONE_IDS.sales,
  },
  {
    id: TINDA_ROADMAP_ITEM_IDS.scale,
    title: "Масштабирование",
    description: "Расширение клиентов, новые регионы, новые категории.",
    orderNumber: 3,
    status: "planned" as const,
    milestoneId: TINDA_MILESTONE_IDS.scale,
  },
] as const;

export const tindaExecutionTasks = [
  {
    id: TINDA_TASK_IDS.assortment,
    itemId: TINDA_ROADMAP_ITEM_IDS.prep,
    title: "Ассортимент",
    description: "Зафиксировать приоритетные категории SKU для пилота.",
    status: "completed" as const,
  },
  {
    id: TINDA_TASK_IDS.suppliers,
    itemId: TINDA_ROADMAP_ITEM_IDS.prep,
    title: "Поставщики",
    description: "Сегментировать ключевых и логистических поставщиков в CRM.",
    status: "completed" as const,
  },
  {
    id: TINDA_TASK_IDS.warehouse,
    itemId: TINDA_ROADMAP_ITEM_IDS.prep,
    title: "Склад",
    description: "Проверить складскую схему по ключевым SKU.",
    status: "completed" as const,
  },
  {
    id: TINDA_TASK_IDS.findClients,
    itemId: TINDA_ROADMAP_ITEM_IDS.sales,
    title: "Поиск клиентов",
    description: "Расширить воронку B2B-клиентов в регионе.",
    status: "in_progress" as const,
  },
  {
    id: TINDA_TASK_IDS.negotiations,
    itemId: TINDA_ROADMAP_ITEM_IDS.sales,
    title: "Переговоры",
    description: "Вести переговоры с ключевыми розничными сетями.",
    status: "in_progress" as const,
  },
  {
    id: TINDA_TASK_IDS.firstDeals,
    itemId: TINDA_ROADMAP_ITEM_IDS.sales,
    title: "Первые сделки",
    description: "Закрыть пилотные сделки через workspace ЦКР.",
    status: "new" as const,
  },
  {
    id: TINDA_TASK_IDS.expandClients,
    itemId: TINDA_ROADMAP_ITEM_IDS.scale,
    title: "Расширение клиентов",
    description: "Увеличить клиентскую базу за пределами текущего ядра.",
    status: "new" as const,
  },
  {
    id: TINDA_TASK_IDS.newRegions,
    itemId: TINDA_ROADMAP_ITEM_IDS.scale,
    title: "Новые регионы",
    description: "Подготовить выход в соседние регионы ДВ.",
    status: "new" as const,
  },
  {
    id: TINDA_TASK_IDS.newCategories,
    itemId: TINDA_ROADMAP_ITEM_IDS.scale,
    title: "Новые категории",
    description: "Добавить 1–2 новые категории ассортимента.",
    status: "new" as const,
  },
] as const;

export const tindaExecutionMetrics = [
  {
    id: TINDA_METRIC_IDS.contacts,
    name: "Количество контактов",
    description: "Контакты CRM по сегментам клиентов / поставщиков / партнёров",
    targetValue: 50,
    currentValue: 6,
    unit: "шт",
    period: "year",
  },
  {
    id: TINDA_METRIC_IDS.clients,
    name: "Количество клиентов",
    description: "Активные B2B-клиенты оптовой платформы",
    targetValue: 100,
    currentValue: 25,
    unit: "шт",
    period: "year",
  },
  {
    id: TINDA_METRIC_IDS.negotiations,
    name: "Количество переговоров",
    description: "Активные переговоры с клиентами и партнёрами",
    targetValue: 30,
    currentValue: 8,
    unit: "шт",
    period: "year",
  },
  {
    id: TINDA_METRIC_IDS.partners,
    name: "Количество партнёров",
    description: "Стратегические и операционные партнёры",
    targetValue: 20,
    currentValue: 2,
    unit: "шт",
    period: "year",
  },
  {
    id: TINDA_METRIC_IDS.deals,
    name: "Количество сделок",
    description: "Сделки в контуре ЦКР по проекту ТИНДА",
    targetValue: 10,
    currentValue: 1,
    unit: "шт",
    period: "year",
  },
  {
    id: TINDA_METRIC_IDS.assortment,
    name: "Рост ассортимента",
    description: "Новые категории / SKU в оптовой платформе",
    targetValue: 15,
    currentValue: 3,
    unit: "категорий",
    period: "year",
  },
] as const;

/** Подготовка результатов пилота (этап 34) — связь с KPI через metric_id. */
export const tindaProjectResults = [
  {
    id: TINDA_RESULT_IDS.clients,
    resultType: "growth" as const,
    title: "Подключено 50 клиентов",
    description: "Целевой кейс роста клиентской базы оптовой платформы.",
    value: 50,
    unit: "шт",
    metricId: TINDA_METRIC_IDS.clients,
  },
  {
    id: TINDA_RESULT_IDS.deals,
    resultType: "partnership" as const,
    title: "Заключено 10 договоров",
    description: "Целевой кейс сделок / договоров в контуре ЦКР.",
    value: 10,
    unit: "шт",
    metricId: TINDA_METRIC_IDS.deals,
  },
  {
    id: TINDA_RESULT_IDS.partners,
    resultType: "partnership" as const,
    title: "Найдено 5 партнёров",
    description: "Целевой кейс партнёрской сети ТИНДА.",
    value: 5,
    unit: "шт",
    metricId: TINDA_METRIC_IDS.partners,
  },
] as const;

export const tindaFinancialMetrics = [
  {
    id: TINDA_FINANCIAL_IDS.investment,
    metricType: "investment" as const,
    value: 25_000_000,
    currency: "RUB",
    period: "year",
  },
  {
    id: TINDA_FINANCIAL_IDS.revenue,
    metricType: "revenue" as const,
    value: 4_500_000,
    currency: "RUB",
    period: "quarter",
  },
] as const;

export const tindaOrganization = {
  id: TINDA_ORG_ID,
  name: "ООО ТИНДА",
  type: "company" as const,
  website: "",
  region: "Амурская область",
  city: "Тында",
  verificationStatus: "verified" as const,
  description: [
    "ООО ТИНДА — оптовая торговая компания, развивающая цифровую платформу закупок и поставок для регионального B2B.",
    "Отрасль: оптовая торговля / trade.",
    "Фокус пилота: упаковать текущий бизнес в проект ЦКР, пройти анализ Лии, выстроить этапы реализации и CRM-контур.",
  ].join("\n\n"),
};

/** Методология ЦКР, применённая к пилоту ТИНДА (этап 32). */
export const tindaMethodology = {
  templateId: "business_development" as const,
  /** Текущий этап методологии: после диагностики и стратегии — поиск ресурсов. */
  currentStage: "resource_search" as CkrMethodologyStage,
  strategicGoals: [
    "Усилить B2B-продажи и дисциплину воронки в текущем регионе",
    "Расширить сеть поставщиков и стратегических партнёров",
    "Подготовить оборотный капитал и экспертизу для масштабирования",
    "Стандартизировать сопровождение сделок через ЦКР",
  ],
} as const;

export const tindaRoadmap: RoadmapDraft = {
  projectId: TINDA_PROJECT_ID,
  title: "Roadmap развития оптовой платформы ТИНДА",
  horizon: "6–12 месяцев",
  currentStage: "resource_search",
  notes:
    "Структура RoadmapDraft без генерации файлов. Вехи согласованы с workspace milestones и методологией ЦКР.",
  items: [
    {
      id: "tinda-roadmap-diagnosis",
      title: "Диагностика и контур в ЦКР",
      description:
        "Профиль организации, проект, аудит ресурсов, CRM-сегменты.",
      methodologyStage: "diagnosis",
      status: "completed",
      order: 1,
    },
    {
      id: "tinda-roadmap-strategy",
      title: "Стратегия развития",
      description:
        "Цели роста, направления, риски; сценарий Лии «Разработать стратегию развития».",
      methodologyStage: "strategy",
      status: "completed",
      order: 2,
    },
    {
      id: "tinda-roadmap-resources",
      title: "Поиск ресурсов",
      description:
        "Партнёры, капитал, экспертиза; CRM + find_solutions; усиление продаж.",
      methodologyStage: "resource_search",
      status: "in_progress",
      order: 3,
    },
    {
      id: "tinda-roadmap-deal",
      title: "Подготовка сделки",
      description:
        "Пилотная сделка negotiation, пакеты данных, InvestmentProposalDraft при необходимости.",
      methodologyStage: "deal_preparation",
      status: "planned",
      order: 4,
    },
    {
      id: "tinda-roadmap-realize",
      title: "Реализация",
      description:
        "Исполнение этапов workspace: партнёры → масштабирование.",
      methodologyStage: "realization",
      status: "planned",
      order: 5,
    },
    {
      id: "tinda-roadmap-control",
      title: "Контроль результата",
      description: "KPI роста, reputation, выводы для следующего цикла.",
      methodologyStage: "result_control",
      status: "planned",
      order: 6,
    },
  ],
};

export const tindaProject = {
  id: TINDA_PROJECT_ID,
  slug: "razvitie-optovoy-platformy-tinda",
  title: "Развитие оптовой платформы ТИНДА",
  summary:
    "Масштабирование оптовой B2B-платформы ТИНДА: ассортимент, продажи, партнёрская сеть и выход в новые регионы.",
  category: "trade",
  region: "Амурская область",
  investmentRequired: 25_000_000,
  currency: "RUB",
  stage: "operating" as const,
  status: "active" as const,
  description: [
    "## Описание",
    "Проект направлен на развитие оптовой цифровой платформы ООО ТИНДА: усиление продаж, подключение поставщиков и партнёров, стандартизация сопровождения сделок через ЦКР.",
    "",
    "## Методология ЦКР",
    `- Шаблон: \`${tindaMethodology.templateId}\``,
    `- Текущий этап: **Поиск ресурсов** (\`${tindaMethodology.currentStage}\`)`,
    "- Документ: docs/ckr-methodology.md",
    "",
    "## Стратегические цели",
    ...tindaMethodology.strategicGoals.map((item) => `- ${item}`),
    "",
    "## Roadmap",
    `- Горизонт: ${tindaRoadmap.horizon}`,
    ...tindaRoadmap.items.map(
      (item) =>
        `- ${item.order}. ${item.title} — ${item.status} (${item.methodologyStage})`,
    ),
    "",
    "## Текущие ресурсы",
    "- Действующая оптовая модель и база клиентов в регионе",
    "- Команда закупок и продаж",
    "- Складская и логистическая схема для ключевых SKU",
    "- Кабинет организации в ЦКР и готовность к сопровождению",
    "",
    "## Необходимые ресурсы",
    "- Партнёры по дистрибуции и логистике в новых регионах",
    "- Дополнительный оборотный капитал на расширение ассортимента",
    "- Экспертиза по цифровым продажам B2B и CRM-процессам",
    "- Инвестиции / партнёрский капитал на масштабирование платформы",
    "",
    "## Цели проекта в ЦКР",
    "- Зафиксировать проектный контур ТИНДА в ЦКР",
    "- Получить анализ и рекомендации Лии по ресурсам и рискам",
    "- Выстроить workspace: подготовка → продажи → партнёры → масштабирование",
    "- Наполнить CRM сегментами клиентов, поставщиков и партнёров",
    "- Подготовить почву для сделок и репутационного профиля организации",
  ].join("\n"),
};

export const tindaMilestones = [
  {
    id: TINDA_MILESTONE_IDS.prep,
    title: "Подготовка",
    description:
      "Сбор данных по ассортименту, юнит-экономике, текущим клиентам и поставщикам. Заполнение профиля организации и проекта в ЦКР.",
    status: "completed" as const,
    sortOrder: 10,
  },
  {
    id: TINDA_MILESTONE_IDS.sales,
    title: "Продажи",
    description:
      "Усиление B2B-продаж: сегментация клиентов, воронка заявок, пилотные сделки через workspace.",
    status: "in_progress" as const,
    sortOrder: 20,
  },
  {
    id: TINDA_MILESTONE_IDS.partners,
    title: "Партнёры",
    description:
      "Подключение поставщиков и стратегических партнёров, оформление partnership-связей и CRM-контактов.",
    status: "planned" as const,
    sortOrder: 30,
  },
  {
    id: TINDA_MILESTONE_IDS.scale,
    title: "Масштабирование",
    description:
      "Выход в новые регионы, рост оборота платформы, повторные сделки и репутационные подтверждения.",
    status: "planned" as const,
    sortOrder: 40,
  },
];

export const tindaCrmContacts = [
  {
    id: TINDA_CRM_IDS.clientA,
    name: "Сегмент: ключевые клиенты (розничные сети)",
    companyName: "ООО ТИНДА — клиенты",
    type: "company" as const,
    source: "tinda-pilot",
    status: "active" as const,
    notes:
      "Сегмент CRM «клиенты». Розничные и корпоративные покупатели оптовой платформы. Без реальных ПДн.",
  },
  {
    id: TINDA_CRM_IDS.clientB,
    name: "Сегмент: SMB-клиенты региона",
    companyName: "ООО ТИНДА — клиенты",
    type: "entrepreneur" as const,
    source: "tinda-pilot",
    status: "new" as const,
    notes: "Сегмент CRM «клиенты». Малый бизнес — потенциальные оптовые закупки.",
  },
  {
    id: TINDA_CRM_IDS.supplierA,
    name: "Сегмент: основные поставщики",
    companyName: "ООО ТИНДА — поставщики",
    type: "company" as const,
    source: "tinda-pilot",
    status: "active" as const,
    notes:
      "Сегмент CRM «поставщики». Производители и дистрибьюторы ключевых категорий.",
  },
  {
    id: TINDA_CRM_IDS.supplierB,
    name: "Сегмент: логистические поставщики",
    companyName: "ООО ТИНДА — поставщики",
    type: "company" as const,
    source: "tinda-pilot",
    status: "new" as const,
    notes: "Сегмент CRM «поставщики». Склад / доставка / last-mile.",
  },
  {
    id: TINDA_CRM_IDS.partnerA,
    name: "Сегмент: стратегические партнёры",
    companyName: "ООО ТИНДА — партнёры",
    type: "partner" as const,
    source: "tinda-pilot",
    status: "active" as const,
    notes:
      "Сегмент CRM «партнёры». Совместные продажи, региональная экспансия.",
  },
  {
    id: TINDA_CRM_IDS.partnerB,
    name: "Сегмент: финансовые / экспертные партнёры",
    companyName: "ООО ТИНДА — партнёры",
    type: "partner" as const,
    source: "tinda-pilot",
    status: "new" as const,
    notes:
      "Сегмент CRM «партнёры». Капитал, экспертиза, сопровождение масштабирования.",
  },
];

export function buildTindaLiaReport(): SolutionReport {
  const available = [
    "Действующая оптовая модель и клиентская база в Амурской области",
    "Команда закупок и продаж",
    "Складская схема и логистика по ключевым SKU",
    "Профиль организации и проект в ЦКР",
  ];
  const missing = [
    "Партнёры по дистрибуции за пределами текущего региона",
    "Оборотный капитал на расширение ассортимента",
    "Экспертиза по цифровым B2B-продажам и CRM-процессу",
    "Инвестиционное / партнёрское финансирование масштабирования",
  ];
  const recommendations = [
    "Закрепить воронку «клиент → заявка → сделка» в CRM и workspace проекта",
    "Выделить 2–3 приоритетные категории ассортимента для пилотного роста",
    "Подключить поставщиков и логистических партнёров через сегменты CRM и partnerships",
    "Использовать Лию в режиме find_solutions для подбора инвестиций и экспертов под trade",
    "Вести этапы: подготовка → продажи → партнёры → масштабирование",
  ];
  const risks = [
    "Концентрация продаж в одном регионе",
    "Зависимость от ограниченного круга поставщиков",
    "Недостаток оборотного капитала при резком росте заказов",
    "Риск «размытия» фокуса без жёсткой приоритизации категорий",
  ];
  const nextSteps = [
    "Завершить сегментацию CRM: клиенты / поставщики / партнёры",
    "Запустить 1–2 пилотные сделки в статусе negotiation",
    "Найти инвестиционное предложение или партнёра под оборотный капитал",
    "Назначить ответственных по этапам workspace",
    "Собрать feedback пилота в /admin/pilot",
  ];

  const solutionDraft = {
    project_id: TINDA_PROJECT_ID,
    summary:
      "ТИНДА имеет работающую оптовую базу и команду; для роста платформы критичны партнёры, капитал и дисциплина CRM/сделок.",
    available_resources: available,
    missing_resources: missing,
    recommendations,
    risks,
    next_steps: nextSteps,
  };

  return {
    project: {
      id: TINDA_PROJECT_ID,
      title: tindaProject.title,
      summary: tindaProject.summary,
      region: tindaProject.region,
      category: tindaProject.category,
      stage: tindaProject.stage,
      investment_required: tindaProject.investmentRequired,
    },
    available,
    missing,
    searchQueries: [
      "оптовая B2B платформа инвестиции",
      "логистика Дальний Восток партнёры",
      "эксперт digital sales B2B",
    ],
    externalProvider: "pilot-fixture",
    internal: {
      projects: [],
      opportunities: [],
      investments: [],
      experts: [],
    },
    external: [],
    recommendations,
    risks,
    next_steps: nextSteps,
    solutionDraft,
    disclaimer: LIA_DISCLAIMER,
  };
}
