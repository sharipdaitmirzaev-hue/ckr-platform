/** Need Profile / Universal Intent — Stage 4A domain types. */

export const NEED_INTENT_TYPES = [
  "INVEST",
  "SEEK_INVESTMENT",
  "BUY_BUSINESS",
  "SELL_BUSINESS",
  "BUY_PROPERTY",
  "SELL_PROPERTY",
  "SEEK_PROJECT",
  "SEEK_PARTNER",
  "SEEK_SUPPLIER",
  "SEEK_BUYER",
  "SEEK_EXPERT",
  "SEEK_EQUIPMENT",
  "SELL_EQUIPMENT",
  "SEEK_SUPPORT",
  "SEEK_CONTRACT",
  "SUPPLY",
  "DEMAND",
] as const;

export type NeedIntentType = (typeof NEED_INTENT_TYPES)[number] | (string & {});

export const NEED_OWNER_TYPES = ["user", "organization", "project"] as const;
export type NeedOwnerType = (typeof NEED_OWNER_TYPES)[number];

export const NEED_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "FULFILLED",
  "ARCHIVED",
] as const;
export type NeedStatus = (typeof NEED_STATUSES)[number];

export const NEED_VISIBILITY = ["PRIVATE", "CKR_ONLY", "PUBLIC"] as const;
export type NeedVisibility = (typeof NEED_VISIBILITY)[number];

export const NEED_SOURCES = ["manual", "lia_nl", "onboarding"] as const;
export type NeedSource = (typeof NEED_SOURCES)[number];

export const NEED_EVENT_TYPES = [
  "CREATED",
  "UPDATED",
  "STATUS_CHANGED",
  "CONFIRMED_FROM_NL",
  "GRAPH_BRIDGED",
  "ARCHIVED",
] as const;
export type NeedEventType = (typeof NEED_EVENT_TYPES)[number];

export type NeedProfile = {
  id: string;
  intentType: NeedIntentType;
  title: string;
  description: string;
  ownerType: NeedOwnerType;
  ownerId: string;
  status: NeedStatus;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  regions: string[];
  industries: string[];
  keywords: string[];
  criteria: Record<string, unknown>;
  visibility: NeedVisibility;
  priority: string | null;
  timeHorizon: string | null;
  riskPreference: string | null;
  matchingEnabled: boolean;
  lastMatchedAt: string | null;
  contextGroupId: string | null;
  fingerprint: string | null;
  source: NeedSource;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NeedProfileEvent = {
  id: string;
  needProfileId: string;
  eventType: NeedEventType;
  payload: Record<string, unknown>;
  actorUserId: string | null;
  createdAt: string;
};

export type CreateNeedProfileInput = {
  intentType: NeedIntentType;
  title: string;
  description?: string;
  ownerType: NeedOwnerType;
  ownerId: string;
  status?: NeedStatus;
  budgetMin?: number | null;
  budgetMax?: number | null;
  currency?: string;
  regions?: string[];
  industries?: string[];
  keywords?: string[];
  criteria?: Record<string, unknown>;
  visibility?: NeedVisibility;
  priority?: string | null;
  timeHorizon?: string | null;
  riskPreference?: string | null;
  matchingEnabled?: boolean;
  contextGroupId?: string | null;
  source?: NeedSource;
  createdBy?: string | null;
  fingerprint?: string | null;
};

export type UpdateNeedProfileInput = Partial<
  Omit<CreateNeedProfileInput, "ownerType" | "ownerId" | "createdBy" | "source">
> & {
  lastMatchedAt?: string | null;
};

/** Draft from NL parser — must be confirmed before save. */
export type NeedProfileDraft = {
  intentType: NeedIntentType;
  title: string;
  description: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  currency?: string;
  regions: string[];
  industries: string[];
  keywords: string[];
  criteria: Record<string, unknown>;
  confidence: number;
  reasoningSummary: string;
  requiresConfirmation: boolean;
};

export type ParseNeedDraftResult = {
  drafts: NeedProfileDraft[];
  contextGroupSuggested: boolean;
  rawText: string;
};

export const INTENT_LABELS: Record<string, string> = {
  INVEST: "Вложить деньги",
  SEEK_INVESTMENT: "Найти инвестора",
  BUY_BUSINESS: "Купить бизнес",
  SELL_BUSINESS: "Продать бизнес",
  BUY_PROPERTY: "Купить помещение/землю",
  SELL_PROPERTY: "Продать помещение/землю",
  SEEK_PROJECT: "Найти проект",
  SEEK_PARTNER: "Найти партнёра",
  SEEK_SUPPLIER: "Найти поставщика",
  SEEK_BUYER: "Найти покупателя",
  SEEK_EXPERT: "Найти эксперта",
  SEEK_EQUIPMENT: "Найти оборудование",
  SELL_EQUIPMENT: "Продать оборудование",
  SEEK_SUPPORT: "Найти господдержку",
  SEEK_CONTRACT: "Найти контракт/заказ",
  SUPPLY: "Предлагаю поставку",
  DEMAND: "Заявляю потребность",
};
