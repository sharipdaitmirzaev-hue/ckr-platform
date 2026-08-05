import type {
  CommissionStatus,
  CommissionType,
  ServiceCategory,
  SubscriptionPlanStatus,
  SubscriptionPlanType,
  SubscriptionStatus,
} from "@/types";

export const SUBSCRIPTION_PLAN_TYPES = [
  "investor",
  "company",
  "expert",
  "enterprise",
] as const satisfies readonly SubscriptionPlanType[];

export const SUBSCRIPTION_PLAN_STATUSES = [
  "active",
  "inactive",
] as const satisfies readonly SubscriptionPlanStatus[];

export const SUBSCRIPTION_STATUSES = [
  "active",
  "expired",
  "cancelled",
] as const satisfies readonly SubscriptionStatus[];

export const SERVICE_CATEGORIES = [
  "business_plan",
  "legal",
  "marketing",
  "consulting",
  "investment_search",
  "project_support",
] as const satisfies readonly ServiceCategory[];

export const COMMISSION_TYPES = [
  "fixed",
  "percent",
] as const satisfies readonly CommissionType[];

export const COMMISSION_STATUSES = [
  "pending",
  "paid",
  "cancelled",
] as const satisfies readonly CommissionStatus[];

export const planTypeLabels: Record<SubscriptionPlanType, string> = {
  investor: "Инвестор",
  company: "Компания",
  expert: "Эксперт",
  enterprise: "Enterprise",
};

export const planStatusLabels: Record<SubscriptionPlanStatus, string> = {
  active: "Активен",
  inactive: "Неактивен",
};

export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  active: "Активна",
  expired: "Истекла",
  cancelled: "Отменена",
};

export const serviceCategoryLabels: Record<ServiceCategory, string> = {
  business_plan: "Бизнес-план",
  legal: "Юридические услуги",
  marketing: "Маркетинг",
  consulting: "Консалтинг",
  investment_search: "Поиск инвестиций",
  project_support: "Сопровождение проекта",
};

export const commissionTypeLabels: Record<CommissionType, string> = {
  fixed: "Фиксированная",
  percent: "Процент",
};

export const commissionStatusLabels: Record<CommissionStatus, string> = {
  pending: "Ожидает",
  paid: "Оплачена",
  cancelled: "Отменена",
};

export const periodLabels: Record<string, string> = {
  month: "в месяц",
  year: "в год",
  once: "разово",
};

/** Fallback-контент, если БД недоступна или миграция ещё не применена. */
export const defaultSubscriptionPlans = [
  {
    id: "plan-investor",
    name: "Инвестор",
    type: "investor" as const,
    description:
      "Доступ к каталогу проектов, приоритетные заявки и сопровождение сделок.",
    price: 9900,
    period: "month",
    features: [
      "Каталог проектов без ограничений",
      "Приоритет заявок",
      "Уведомления о новых проектах",
      "Базовое сопровождение сделок",
    ],
    status: "active" as const,
  },
  {
    id: "plan-company",
    name: "Компания",
    type: "company" as const,
    description:
      "Для команд: проекты, возможности, эксперты и рабочий кабинет реализации.",
    price: 14900,
    period: "month",
    features: [
      "Публикация проектов и возможностей",
      "Доступ к экспертам ЦКР",
      "Кабинет проекта и сделки",
      "Консультация Лии по сценариям",
    ],
    status: "active" as const,
  },
  {
    id: "plan-expert",
    name: "Эксперт",
    type: "expert" as const,
    description:
      "Публичный профиль в каталоге доверия и заявки от проектов региона.",
    price: 4900,
    period: "month",
    features: [
      "Профиль в каталоге экспертов",
      "Заявки от предпринимателей",
      "Участие в сделках проектов",
      "Значок верификации после проверки",
    ],
    status: "active" as const,
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    type: "enterprise" as const,
    description:
      "Индивидуальное сопровождение портфеля проектов и выделенный менеджер ЦКР.",
    price: 99000,
    period: "month",
    features: [
      "Всё из тарифа Компания",
      "Выделенный менеджер",
      "Индивидуальные комиссии",
      "Приоритетная модерация",
      "Отчётность по портфелю",
    ],
    status: "active" as const,
  },
];

export const defaultServices = [
  {
    id: "svc-business-plan",
    title: "Бизнес-план под проект",
    description: "Структура, финансы и дорожная карта под ваш проект в ЦКР.",
    category: "business_plan" as const,
    price: 45000,
    status: "active" as const,
  },
  {
    id: "svc-legal",
    title: "Юридическое сопровождение",
    description: "Договоры, корпоративная структура и проверка контрагентов.",
    category: "legal" as const,
    price: 35000,
    status: "active" as const,
  },
  {
    id: "svc-marketing",
    title: "Маркетинг запуска",
    description:
      "Позиционирование, канал привлечения и материалы для инвесторов.",
    category: "marketing" as const,
    price: 40000,
    status: "active" as const,
  },
  {
    id: "svc-consulting",
    title: "Стратегическая консультация",
    description:
      "Разбор идеи, ресурсов и следующего шага с экспертом ЦКР.",
    category: "consulting" as const,
    price: 15000,
    status: "active" as const,
  },
  {
    id: "svc-investment",
    title: "Поиск инвестиций",
    description:
      "Подбор инвесторов и подготовка к переговорам по проекту.",
    category: "investment_search" as const,
    price: 60000,
    status: "active" as const,
  },
  {
    id: "svc-support",
    title: "Сопровождение проекта",
    description: "Ведение этапов, сделок и коммуникаций до результата.",
    category: "project_support" as const,
    price: 80000,
    status: "active" as const,
  },
];
