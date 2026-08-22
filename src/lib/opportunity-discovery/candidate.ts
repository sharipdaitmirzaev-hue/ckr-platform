/**
 * Stage 4O — candidate helpers: labels, provenance, realness.
 */

import { classifyFixtureSignal } from "@/lib/personalized-feed/fixtures";
import type {
  DataRealness,
  DiscoveryCandidate,
  DiscoveryEntityType,
  DiscoveryOrigin,
  DiscoveryProvenance,
  DiscoverySourceCategory,
  InternalCatalogRow,
  ProvenanceTrust,
  SuitabilityLabel,
} from "@/lib/opportunity-discovery/types";

export function suitabilityLabelRu(s: SuitabilityLabel): string {
  switch (s) {
    case "SUITABLE":
      return "Подходящий вариант";
    case "POSSIBLE":
      return "Возможный вариант";
    case "NEEDS_CHECK":
      return "Требует проверки";
    case "WEAK":
      return "Слабый сигнал";
    case "NOT_SUITABLE":
      return "Не подходит";
    default:
      return "Требует проверки";
  }
}

export function entityTypeLabelRu(t: DiscoveryEntityType): string {
  switch (t) {
    case "organization":
      return "Компания";
    case "need_profile":
      return "Потребность";
    case "project":
      return "Проект";
    case "opportunity":
      return "Возможность";
    case "investment_offer":
      return "Инвестиции";
    case "expert_profile":
      return "Эксперт";
    case "lia_oi":
      return "Сигнал LIA OI";
    case "external_signal":
      return "Внешний сигнал";
    default:
      return "Объект";
  }
}

export function sourceCategoryLabelRu(c: DiscoverySourceCategory): string {
  const map: Record<DiscoverySourceCategory, string> = {
    PROCUREMENT: "Закупки",
    SUPPORT: "Господдержка",
    BUSINESS_FOR_SALE: "Бизнес на продажу",
    INVESTMENT_PROJECT: "Инвестиционный проект",
    PROPERTY: "Недвижимость",
    LAND: "Земля",
    EQUIPMENT: "Оборудование",
    SUPPLIER_REQUEST: "Поиск поставщика",
    BUYER_DEMAND: "Спрос",
    PARTNERSHIP: "Партнёрство",
    COMPANY: "Компания",
    EXPERT: "Эксперт",
    INFRASTRUCTURE: "Инфраструктура",
    CAPITAL: "Капитал",
    MARKET_SIGNAL: "Рыночный сигнал",
    OTHER: "Другое",
  };
  return map[c] ?? c;
}

export function trustLabelRu(trust: ProvenanceTrust): string {
  switch (trust) {
    case "ckr_internal":
      return "ЦКР";
    case "official":
      return "Официальный источник";
    case "government_open":
      return "Гос. / открытые данные";
    case "regional_portal":
      return "Региональный портал";
    case "company_website":
      return "Сайт компании";
    case "trusted_secondary":
      return "Доверенный вторичный";
    case "general_web":
      return "Общий веб";
    case "search_snippet":
      return "Сниппет поиска";
    default:
      return "Источник";
  }
}

export function internalProvenance(): DiscoveryProvenance {
  return {
    origin: "INTERNAL_CKR",
    trust: "ckr_internal",
    kind: "FACT",
    sourceLabelRu: "ЦКР",
    sourceUrl: null,
    adapterId: null,
  };
}

export function externalProvenance(input: {
  trust: ProvenanceTrust;
  kind?: DiscoveryProvenance["kind"];
  url?: string | null;
  adapterId?: string | null;
}): DiscoveryProvenance {
  return {
    origin: "EXTERNAL",
    trust: input.trust,
    kind: input.kind ?? "INFERENCE",
    sourceLabelRu: trustLabelRu(input.trust),
    sourceUrl: input.url ?? null,
    adapterId: input.adapterId ?? null,
  };
}

export function classifyRealness(row: {
  id?: string | null;
  title?: string | null;
  summary?: string | null;
  isStub?: boolean;
  fingerprint?: string | null;
  sourceType?: string | null;
}): DataRealness {
  if (row.isStub) return "STUB";
  const cls = classifyFixtureSignal({
    id: row.id,
    title: row.title,
    summary: row.summary,
    fingerprint: row.fingerprint,
    sourceType: row.sourceType,
  });
  if (cls === "SMOKE") return "SMOKE";
  if (cls === "SEED") return "SEED";
  if (cls === "STUB") return "STUB";
  if (cls === "REAL" || cls === "UNKNOWN") return cls === "REAL" ? "REAL" : "UNKNOWN";
  return "UNKNOWN";
}

export function isNoiseRealness(r: DataRealness): boolean {
  return r === "SMOKE" || r === "SEED" || r === "STUB" || r === "DEMO";
}

export function categoryForEntity(
  entityType: DiscoveryEntityType,
  hint?: string | null,
): DiscoverySourceCategory {
  const h = (hint || "").toLowerCase();
  if (entityType === "organization") return "COMPANY";
  if (entityType === "need_profile") {
    if (/buyer|demand|seek_buyer/.test(h)) return "BUYER_DEMAND";
    return "MARKET_SIGNAL";
  }
  if (entityType === "project") return "INVESTMENT_PROJECT";
  if (entityType === "investment_offer") return "CAPITAL";
  if (entityType === "expert_profile") return "EXPERT";
  if (entityType === "opportunity") {
    if (h.includes("procurement") || h.includes("закуп")) return "PROCUREMENT";
    if (h.includes("support") || h.includes("поддерж")) return "SUPPORT";
    if (h.includes("land") || h.includes("земл")) return "LAND";
    if (h.includes("premises") || h.includes("недвиж")) return "PROPERTY";
    if (h.includes("equipment") || h.includes("оборуд")) return "EQUIPMENT";
    return "MARKET_SIGNAL";
  }
  if (entityType === "lia_oi" || entityType === "external_signal") {
    if (h.includes("procurement")) return "PROCUREMENT";
    if (h.includes("investment") || h.includes("business"))
      return "INVESTMENT_PROJECT";
    return "MARKET_SIGNAL";
  }
  return "OTHER";
}

export function rowToBaseCandidate(
  row: InternalCatalogRow,
  extras: {
    suitability: SuitabilityLabel;
    whyRelevant: string[];
    confidence: number;
    quality: number;
    pass?: DiscoveryCandidate["pass"];
    provenance?: DiscoveryProvenance;
    visibility?: DiscoveryCandidate["visibility"];
  },
): DiscoveryCandidate {
  const realness = classifyRealness(row);
  const origin: DiscoveryOrigin =
    extras.provenance?.origin ?? "INTERNAL_CKR";
  const visibility =
    extras.visibility ??
    (row.entityType === "lia_oi" || row.entityType === "external_signal"
      ? "OWNER_ONLY"
      : row.status === "published" || !row.status
        ? "CLIENT_SHAREABLE"
        : "STAFF");

  return {
    id: `disc_${row.entityType}_${row.id}`,
    entityType: row.entityType,
    sourceCategory: categoryForEntity(row.entityType, row.sourceType),
    sourceEntityId: row.id,
    title: row.title,
    summary: row.summary || "",
    region: row.region ?? null,
    industry: row.industry ?? null,
    amount: row.amount ?? null,
    deadline: row.deadline ?? null,
    organization: row.organization ?? null,
    url: row.url ?? null,
    href: row.href,
    confidence: extras.confidence,
    quality: extras.quality,
    suitability: extras.suitability,
    suitabilityLabelRu: suitabilityLabelRu(extras.suitability),
    provenance: extras.provenance ?? internalProvenance(),
    whyRelevant: extras.whyRelevant,
    unknownFields: [
      !row.region ? "region" : null,
      row.amount == null ? "amount" : null,
      !row.industry ? "industry" : null,
      !row.deadline ? "deadline" : null,
    ].filter(Boolean) as string[],
    visibility,
    reviewState: "NEW",
    realness,
    pass: extras.pass ?? (origin === "INTERNAL_CKR" ? "INTERNAL" : "GENERAL_WEB"),
  };
}

/** Client-facing copy — no engine jargon. */
export function clientFacingCandidateCopy(c: DiscoveryCandidate): {
  headline: string;
  status: string;
} {
  return {
    headline: "ЦКР нашёл вариант",
    status:
      c.suitability === "SUITABLE"
        ? "Может подойти"
        : c.suitability === "POSSIBLE"
          ? "Может подойти"
          : c.suitability === "NEEDS_CHECK"
            ? "Требует уточнения"
            : "Нужна информация от вас",
  };
}
