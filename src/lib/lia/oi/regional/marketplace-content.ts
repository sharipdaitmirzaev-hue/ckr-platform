/**
 * Stage 4E — safe owner-manual marketplace content types.
 * Not fake listings. Expansion beyond LIA OI discovery.
 */

export type MarketplaceManualContentType =
  | "investment_project"
  | "ready_business"
  | "land_plot"
  | "production_site"
  | "demand_need"
  | "supplier_offer";

export type MarketplaceManualContentSpec = {
  type: MarketplaceManualContentType;
  labelRu: string;
  createPath: string;
  entity: "project" | "opportunity" | "investment" | "need";
  notes: string;
};

/** Types the owner can safely add manually without generating fakes. */
export const MARKETPLACE_MANUAL_CONTENT_TYPES: MarketplaceManualContentSpec[] = [
  {
    type: "investment_project",
    labelRu: "Инвестиционный проект",
    createPath: "/dashboard/projects/create",
    entity: "project",
    notes: "Реальный проект владельца/партнёра; не автогенерация.",
  },
  {
    type: "ready_business",
    labelRu: "Готовый бизнес",
    createPath: "/dashboard/opportunities/create",
    entity: "opportunity",
    notes: "Публичное предложение с проверяемыми контактами.",
  },
  {
    type: "land_plot",
    labelRu: "Земельный участок",
    createPath: "/dashboard/opportunities/create",
    entity: "opportunity",
    notes: "Объект как элемент проекта; не массовый парсинг объявлений.",
  },
  {
    type: "production_site",
    labelRu: "Производство / площадка",
    createPath: "/dashboard/opportunities/create",
    entity: "opportunity",
    notes: "Brownfield/greenfield с provenance.",
  },
  {
    type: "demand_need",
    labelRu: "Потребность (спрос)",
    createPath: "/dashboard/needs/new",
    entity: "need",
    notes: "Need Profile / публичная потребность — не выдуманный DEMAND.",
  },
  {
    type: "supplier_offer",
    labelRu: "Предложение поставщика",
    createPath: "/dashboard/opportunities/create",
    entity: "opportunity",
    notes: "Реальное предложение поставки; без fake listings.",
  },
];
