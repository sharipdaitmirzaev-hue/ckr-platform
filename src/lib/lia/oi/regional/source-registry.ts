/**
 * Stage 4E — Regional source registry (Dagestan first, then SKFO).
 * Access: public sites / RSS / Serper site-restricted. No CAPTCHA/auth bypass.
 */

import type { CanonicalRegion } from "@/lib/geo/region-normalize";

export type RegionalSourceType =
  | "procurement"
  | "support"
  | "investment"
  | "property"
  | "business"
  | "demand"
  | "portal"
  | "open_data"
  | "news";

export type RegionalAccessMethod =
  | "public_html"
  | "rss"
  | "open_data"
  | "serper_site"
  | "manual_review";

export type RegionalSourceHealth = "OK" | "DEGRADED" | "UNAVAILABLE" | "UNVERIFIED";

export type RegionalSource = {
  id: string;
  sourceName: string;
  region: CanonicalRegion | "СКФО" | "Россия";
  sourceType: RegionalSourceType;
  domain: string;
  accessMethod: RegionalAccessMethod;
  official: boolean;
  /** Prefer in planner when true */
  enabled: boolean;
  priority: number;
  health: RegionalSourceHealth;
  lastChecked: string | null;
  notes: string;
  /** Intent tags this source helps with */
  intents: string[];
};

/** Dagestan — first full coverage region. */
export const DAGESTAN_SOURCES: RegionalSource[] = [
  {
    id: "dag_e-dag",
    sourceName: "Официальный портал Республики Дагестан",
    region: "Дагестан",
    sourceType: "portal",
    domain: "e-dag.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: true,
    priority: 10,
    health: "UNVERIFIED",
    lastChecked: null,
    notes: "Государственный портал; закупки/новости/программы.",
    intents: ["SEEK_SUPPORT", "SEEK_CONTRACT", "INVEST", "SEEK_PROJECT"],
  },
  {
    id: "dag_minec",
    sourceName: "Минэкономразвития РД",
    region: "Дагестан",
    sourceType: "investment",
    domain: "minec.e-dag.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: true,
    priority: 20,
    health: "UNVERIFIED",
    lastChecked: null,
    notes: "Инвестпроекты, экономика, господдержка.",
    intents: ["INVEST", "SEEK_PROJECT", "SEEK_SUPPORT"],
  },
  {
    id: "dag_minprom",
    sourceName: "Минпромторг / промышленность РД",
    region: "Дагестан",
    sourceType: "support",
    domain: "minprom.e-dag.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: true,
    priority: 25,
    health: "UNVERIFIED",
    lastChecked: null,
    notes: "Промышленность, оборудование, производство.",
    intents: ["SEEK_SUPPORT", "INVEST", "SEEK_PROJECT"],
  },
  {
    id: "dag_minselhoz",
    sourceName: "Минсельхозпрод РД",
    region: "Дагестан",
    sourceType: "support",
    domain: "mcxrd.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: true,
    priority: 30,
    health: "UNVERIFIED",
    lastChecked: null,
    notes: "АПК, переработка, субсидии сельхоз.",
    intents: ["SEEK_SUPPORT", "SEEK_CONTRACT", "SEEK_BUYER", "INVEST"],
  },
  {
    id: "dag_moybiznes",
    sourceName: "Мой бизнес — Дагестан",
    region: "Дагестан",
    sourceType: "support",
    domain: "mbdag.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: true,
    priority: 15,
    health: "UNVERIFIED",
    lastChecked: null,
    notes: "ЦП МСП: гранты, займы, консультации.",
    intents: ["SEEK_SUPPORT", "INVEST"],
  },
  {
    id: "dag_invest",
    sourceName: "Инвестиционный портал / Агентство инвестиций РД",
    region: "Дагестан",
    sourceType: "investment",
    domain: "investindagestan.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: true,
    priority: 18,
    health: "UNVERIFIED",
    lastChecked: null,
    notes: "Инвестплощадки и проекты региона.",
    intents: ["INVEST", "SEEK_PROJECT"],
  },
  {
    id: "dag_krd",
    sourceName: "Корпорация развития Дагестана",
    region: "Дагестан",
    sourceType: "investment",
    domain: "krd-rd.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: true,
    priority: 22,
    health: "UNVERIFIED",
    lastChecked: null,
    notes: "Площадки, индустриальные проекты.",
    intents: ["INVEST", "SEEK_PROJECT"],
  },
  {
    id: "dag_zakupki_geo",
    sourceName: "ЕИС закупки (site + geo Дагестан)",
    region: "Дагестан",
    sourceType: "procurement",
    domain: "zakupki.gov.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: true,
    priority: 5,
    health: "OK",
    lastChecked: "2026-08-11",
    notes: "Публичный каталог; без EIS API credentials. Geo в query.",
    intents: ["SEEK_CONTRACT", "SEEK_BUYER"],
  },
  {
    id: "dag_corpmsp",
    sourceName: "Корпорация МСП (федеральные меры, применимы в РД)",
    region: "Россия",
    sourceType: "support",
    domain: "corpmsp.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: true,
    priority: 35,
    health: "OK",
    lastChecked: "2026-08-11",
    notes: "Федеральная applicability=Russia/Dagestan applicable, не region=Dagestan FACT.",
    intents: ["SEEK_SUPPORT"],
  },
  {
    id: "dag_msp_rf",
    sourceName: "МСП.РФ",
    region: "Россия",
    sourceType: "support",
    domain: "мсп.рф",
    accessMethod: "serper_site",
    official: true,
    enabled: true,
    priority: 36,
    health: "DEGRADED",
    lastChecked: null,
    notes: "Punycode/кириллический домен; Serper site может быть нестабилен.",
    intents: ["SEEK_SUPPORT"],
  },
];

/** SKFO neighbours — registry present; Stage 4E does not require full fill. */
export const SKFO_SOURCES: RegionalSource[] = [
  {
    id: "stav_gov",
    sourceName: "Портал Ставропольского края",
    region: "Ставропольский край",
    sourceType: "portal",
    domain: "stavregion.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: true,
    priority: 40,
    health: "UNVERIFIED",
    lastChecked: null,
    notes: "СКФО шаблон после Дагестана.",
    intents: ["SEEK_SUPPORT", "INVEST", "SEEK_PROJECT"],
  },
  {
    id: "stav_invest",
    sourceName: "Инвестпортал Ставрополья",
    region: "Ставропольский край",
    sourceType: "investment",
    domain: "investstav.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: true,
    priority: 41,
    health: "UNVERIFIED",
    lastChecked: null,
    notes: "Инвестпроекты края.",
    intents: ["INVEST", "SEEK_PROJECT"],
  },
  {
    id: "che_gov",
    sourceName: "Портал Чеченской Республики",
    region: "Чечня",
    sourceType: "portal",
    domain: "chechnya.gov.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: false,
    priority: 50,
    health: "UNVERIFIED",
    lastChecked: null,
    notes: "Заготовка; не активировано в Stage 4E.",
    intents: ["SEEK_SUPPORT", "INVEST"],
  },
  {
    id: "ing_gov",
    sourceName: "Портал Ингушетии",
    region: "Ингушетия",
    sourceType: "portal",
    domain: "ingushetia.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: false,
    priority: 51,
    health: "UNVERIFIED",
    lastChecked: null,
    notes: "Заготовка.",
    intents: ["SEEK_SUPPORT", "INVEST"],
  },
  {
    id: "kbr_gov",
    sourceName: "Портал КБР",
    region: "Кабардино-Балкария",
    sourceType: "portal",
    domain: "pravitelstvokbr.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: false,
    priority: 52,
    health: "UNVERIFIED",
    lastChecked: null,
    notes: "Заготовка.",
    intents: ["SEEK_SUPPORT", "INVEST"],
  },
  {
    id: "oset_gov",
    sourceName: "Портал Северной Осетии",
    region: "Северная Осетия",
    sourceType: "portal",
    domain: "alanianews.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: false,
    priority: 53,
    health: "UNVERIFIED",
    lastChecked: null,
    notes: "Заготовка; домен уточнять при активации.",
    intents: ["SEEK_SUPPORT", "INVEST"],
  },
  {
    id: "kchr_gov",
    sourceName: "Портал КЧР",
    region: "Карачаево-Черкесия",
    sourceType: "portal",
    domain: "kchr.ru",
    accessMethod: "serper_site",
    official: true,
    enabled: false,
    priority: 54,
    health: "UNVERIFIED",
    lastChecked: null,
    notes: "Заготовка.",
    intents: ["SEEK_SUPPORT", "INVEST"],
  },
];

export const ALL_REGIONAL_SOURCES: RegionalSource[] = [
  ...DAGESTAN_SOURCES,
  ...SKFO_SOURCES,
];

export function listRegionalSources(opts?: {
  region?: string;
  intent?: string;
  enabledOnly?: boolean;
}): RegionalSource[] {
  const enabledOnly = opts?.enabledOnly !== false;
  let list = ALL_REGIONAL_SOURCES.slice();
  if (enabledOnly) list = list.filter((s) => s.enabled);
  if (opts?.region) {
    const r = opts.region.toLowerCase();
    list = list.filter(
      (s) =>
        s.region.toLowerCase().includes(r) ||
        r.includes(s.region.toLowerCase()) ||
        (r.includes("скфо") &&
          [
            "Дагестан",
            "Ставропольский край",
            "Чечня",
            "Ингушетия",
            "Кабардино-Балкария",
            "Северная Осетия",
            "Карачаево-Черкесия",
            "СКФО",
          ].includes(s.region)),
    );
  }
  if (opts?.intent) {
    list = list.filter((s) => s.intents.includes(opts.intent!));
  }
  return list.sort((a, b) => a.priority - b.priority);
}

export function domainsForNeed(input: {
  regions: string[];
  intentType: string;
  limit?: number;
}): string[] {
  const regions = input.regions.length ? input.regions : ["Дагестан"];
  const out = new Set<string>();
  for (const region of regions) {
    for (const s of listRegionalSources({
      region,
      intent: input.intentType,
      enabledOnly: true,
    })) {
      out.add(s.domain);
    }
  }
  // Always allow zakupki for contract/buyer
  if (
    input.intentType === "SEEK_CONTRACT" ||
    input.intentType === "SEEK_BUYER"
  ) {
    out.add("zakupki.gov.ru");
  }
  return [...out].slice(0, input.limit ?? 8);
}
