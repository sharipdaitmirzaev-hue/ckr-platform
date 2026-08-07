import type { InvestmentType, InvestmentOfferStatus } from "@/types";

export const INVESTMENT_TYPES = [
  "equity",
  "loan",
  "partnership",
  "purchase",
] as const satisfies readonly InvestmentType[];

export const INVESTMENT_OFFER_STATUSES = [
  "draft",
  "moderation",
  "published",
  "closed",
] as const satisfies readonly InvestmentOfferStatus[];

export const investmentTypeLabels: Record<InvestmentType, string> = {
  equity: "Доля (equity)",
  loan: "Займ",
  partnership: "Партнёрство",
  purchase: "Покупка",
};

export const investmentStatusLabels: Record<InvestmentOfferStatus, string> = {
  draft: "Черновик",
  moderation: "На модерации",
  published: "Опубликовано",
  closed: "Закрыто",
};

export const investmentStatusDescriptions: Record<
  InvestmentOfferStatus,
  string
> = {
  draft: "Видно только владельцу.",
  moderation: "На проверке перед публикацией.",
  published: "В публичном каталоге инвесторов.",
  closed: "Скрыто из каталога.",
};

export const INVESTMENT_CURRENCIES = ["RUB", "USD", "EUR"] as const;

/** Направления для фильтров и формы (slug категорий проектов). */
export const INVESTMENT_DIRECTIONS = [
  { slug: "production", name: "Производство" },
  { slug: "real-estate", name: "Недвижимость" },
  { slug: "agriculture", name: "Сельское хозяйство" },
  { slug: "it", name: "IT" },
  { slug: "tourism", name: "Туризм" },
] as const;

export const AMOUNT_FILTERS = [
  { id: "lt1", label: "до 1 млн", min: 0, max: 1_000_000 },
  { id: "1to10", label: "1–10 млн", min: 1_000_000, max: 10_000_000 },
  { id: "10to50", label: "10–50 млн", min: 10_000_000, max: 50_000_000 },
  { id: "50plus", label: "50+ млн", min: 50_000_000, max: null },
] as const;

export type AmountFilterId = (typeof AMOUNT_FILTERS)[number]["id"];
