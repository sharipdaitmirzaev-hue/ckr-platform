/**
 * First Deals & Revenue — этап 63: операционный контур первых коммерческих результатов.
 * Без отдельной бухгалтерии и без реальных платежей на этом этапе.
 */

/** RevenueSources */
export const REVENUE_SOURCES = [
  "service",
  "deal_commission",
  "subscription",
  "project_support",
  "partner",
] as const;

export type RevenueSource = (typeof REVENUE_SOURCES)[number];

export const revenueSourceLabels: Record<RevenueSource, string> = {
  service: "Услуги ЦКР",
  deal_commission: "Комиссия со сделок",
  subscription: "Подписки",
  project_support: "Сопровождение проектов",
  partner: "Партнёрский канал",
};

/** Коммерческий статус результата сделки */
export const DEAL_REVENUE_STATUSES = [
  "potential",
  "agreed",
  "invoiced",
  "paid",
  "cancelled",
] as const;

export type DealRevenueStatus = (typeof DEAL_REVENUE_STATUSES)[number];

export const dealRevenueStatusLabels: Record<DealRevenueStatus, string> = {
  potential: "Потенциал",
  agreed: "Договорённость",
  invoiced: "Выставлен счёт",
  paid: "Оплачено",
  cancelled: "Отменено",
};

export function isDealRevenueStatus(value: string): value is DealRevenueStatus {
  return (DEAL_REVENUE_STATUSES as readonly string[]).includes(value);
}

/** Периоды дашборда */
export const REVENUE_PERIODS = ["7d", "30d", "90d", "all"] as const;

export type RevenuePeriod = (typeof REVENUE_PERIODS)[number];

export const revenuePeriodLabels: Record<RevenuePeriod, string> = {
  "7d": "7 дней",
  "30d": "30 дней",
  "90d": "90 дней",
  all: "Всё время",
};

export function isRevenuePeriod(value: string): value is RevenuePeriod {
  return (REVENUE_PERIODS as readonly string[]).includes(value);
}

export function revenuePeriodStart(period: RevenuePeriod): Date | null {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/** RevenuePipeline */
export const REVENUE_PIPELINE_STAGES = [
  "lead",
  "business_audit",
  "service_or_project",
  "commercial_proposal",
  "agreement",
  "deal",
  "revenue",
] as const;

export type RevenuePipelineStage = (typeof REVENUE_PIPELINE_STAGES)[number];

export const revenuePipelineStageLabels: Record<RevenuePipelineStage, string> = {
  lead: "Lead",
  business_audit: "Business Audit",
  service_or_project: "Service / Project",
  commercial_proposal: "Commercial Proposal",
  agreement: "Agreement",
  deal: "Deal",
  revenue: "Revenue",
};

/** Стартовый набор услуг (цены не фиксируем без решения админа). */
export const STARTER_CKR_SERVICES = [
  {
    id: "e000000e-0000-4000-8000-000000000001",
    title: "Аудит бизнеса",
    category: "consulting" as const,
    description:
      "Диагностика действующего бизнеса: сильные/слабые стороны, риски и следующие шаги в ЦКР.",
    priceOnRequest: true,
  },
  {
    id: "e000000e-0000-4000-8000-000000000002",
    title: "Подготовка проекта",
    category: "business_plan" as const,
    description:
      "Упаковка бизнес-идеи в карточку проекта ЦКР: цели, ресурсы, стадии.",
    priceOnRequest: true,
  },
  {
    id: "e000000e-0000-4000-8000-000000000003",
    title: "Поиск партнёров",
    category: "marketing" as const,
    description:
      "Подбор организаций и партнёров экосистемы под задачу проекта.",
    priceOnRequest: true,
  },
  {
    id: "e000000e-0000-4000-8000-000000000004",
    title: "Поиск инвестиций",
    category: "investment_search" as const,
    description:
      "Подбор инвестиционных предложений и подготовка к переговорам.",
    priceOnRequest: true,
  },
  {
    id: "e000000e-0000-4000-8000-000000000005",
    title: "Проектное сопровождение",
    category: "project_support" as const,
    description:
      "Ведение этапов, сделок и коммуникаций проекта до результата.",
    priceOnRequest: true,
  },
  {
    id: "e000000e-0000-4000-8000-000000000006",
    title: "Юридическое / экспертное сопровождение",
    category: "legal" as const,
    description:
      "Договоры, экспертиза и сопровождение коммерческих договорённостей.",
    priceOnRequest: true,
  },
] as const;

/** Маппинг deal.status → revenue_status (fallback). */
export function inferRevenueStatus(input: {
  dealStatus: string;
  commissionStatus?: string | null;
  revenueStatus?: string | null;
}): DealRevenueStatus {
  if (input.revenueStatus && isDealRevenueStatus(input.revenueStatus)) {
    return input.revenueStatus;
  }
  if (input.dealStatus === "cancelled") return "cancelled";
  if (input.commissionStatus === "paid" || input.dealStatus === "completed") {
    return "paid";
  }
  if (input.dealStatus === "active") return "invoiced";
  if (input.dealStatus === "agreement") return "agreed";
  return "potential";
}
