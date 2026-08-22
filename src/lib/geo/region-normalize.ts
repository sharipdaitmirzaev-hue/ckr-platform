/**
 * Stage 4D — controlled region normalization (no fuzzy substring traps).
 * Canonical subjects + cities + FO aliases for Dagestan / North Caucasus focus.
 *
 * Note: JS \b is ASCII-only — do not use it for Cyrillic tokens.
 */

export type CanonicalRegion =
  | "Дагестан"
  | "Ставропольский край"
  | "Чечня"
  | "Ингушетия"
  | "Кабардино-Балкария"
  | "Северная Осетия"
  | "Карачаево-Черкесия"
  | "Краснодарский край"
  | "Ростовская область"
  | "Москва"
  | "Санкт-Петербург"
  | "Татарстан"
  | "Новосибирская область"
  | "Свердловская область"
  | "СКФО"
  | "Россия";

type RegionRule = {
  canonical: CanonicalRegion;
  patterns: RegExp[];
  cities?: string[];
  fo?: boolean;
};

/** Cyrillic-safe token edge */
const L = "(^|[^а-яёa-z0-9])";
const R = "($|[^а-яёa-z0-9])";

const RULES: RegionRule[] = [
  {
    canonical: "Дагестан",
    patterns: [
      new RegExp(`${L}республик[аеи]?\\s+дагестан[а-яё]*${R}`, "i"),
      new RegExp(`${L}дагестан[а-яё]*${R}`, "i"),
      new RegExp(`${L}dagestan[a-z]*${R}`, "i"),
    ],
    cities: [
      "махачкала",
      "каспийск",
      "дербент",
      "хасавюрт",
      "избербаш",
      "кизилюрт",
      "буйнакск",
    ],
  },
  {
    canonical: "Ставропольский край",
    patterns: [
      new RegExp(`${L}ставропольск[а-яё]*\\s+кра[йя]${R}`, "i"),
      new RegExp(`${L}ставропол`, "i"),
    ],
    cities: [
      "ставрополь",
      "пятигорск",
      "кисловодск",
      "ессентуки",
      "минеральные воды",
    ],
  },
  {
    canonical: "Чечня",
    patterns: [new RegExp(`${L}чеченск`, "i"), new RegExp(`${L}чечн`, "i")],
    cities: ["грозный"],
  },
  {
    canonical: "Ингушетия",
    patterns: [new RegExp(`${L}ингушет`, "i")],
    cities: ["магас", "назрань"],
  },
  {
    canonical: "Кабардино-Балкария",
    patterns: [new RegExp(`${L}кабардино`, "i"), new RegExp(`${L}кбр${R}`, "i")],
    cities: ["нальчик"],
  },
  {
    canonical: "Северная Осетия",
    patterns: [
      new RegExp(`${L}северн[а-яё]*\\s+осети`, "i"),
      new RegExp(`${L}владикавказ${R}`, "i"),
    ],
    cities: ["владикавказ"],
  },
  {
    canonical: "Карачаево-Черкесия",
    patterns: [new RegExp(`${L}карачаево`, "i"), new RegExp(`${L}кчр${R}`, "i")],
    cities: ["черкесск"],
  },
  {
    canonical: "Краснодарский край",
    patterns: [
      new RegExp(`${L}краснодарск[а-яё]*\\s+кра[йя]${R}`, "i"),
      new RegExp(`${L}краснодар${R}`, "i"),
    ],
    cities: ["краснодар", "сочи", "новороссийск", "анапа"],
  },
  {
    canonical: "Ростовская область",
    patterns: [
      new RegExp(`${L}ростовск[а-яё]*\\s+област`, "i"),
      new RegExp(`${L}ростов[-\\s]?на[-\\s]?дону${R}`, "i"),
    ],
    cities: ["ростов-на-дону"],
  },
  {
    canonical: "Москва",
    patterns: [new RegExp(`${L}москв`, "i"), new RegExp(`${L}мск${R}`, "i")],
  },
  {
    canonical: "Санкт-Петербург",
    patterns: [
      new RegExp(`${L}санкт[-\\s]?петербург`, "i"),
      new RegExp(`${L}спб${R}`, "i"),
    ],
  },
  {
    canonical: "Татарстан",
    patterns: [new RegExp(`${L}татарстан`, "i"), new RegExp(`${L}казан`, "i")],
  },
  {
    canonical: "Новосибирская область",
    patterns: [new RegExp(`${L}новосибир`, "i")],
  },
  {
    canonical: "Свердловская область",
    patterns: [new RegExp(`${L}свердлов`, "i"), new RegExp(`${L}екатеринбург`, "i")],
  },
  {
    canonical: "СКФО",
    patterns: [
      new RegExp(`${L}скфо${R}`, "i"),
      new RegExp(
        `${L}северо[-\\s]?кавказск[а-яё]*\\s+федеральн[а-яё]*\\s+округ${R}`,
        "i",
      ),
      new RegExp(`${L}северо[-\\s]?кавказск[а-яё]*\\s+округ${R}`, "i"),
    ],
    fo: true,
  },
  {
    canonical: "Россия",
    patterns: [
      new RegExp(`${L}по\\s+росси`, "i"),
      new RegExp(`${L}росси[яи]${R}`, "i"),
      new RegExp(`${L}rf${R}`, "i"),
      new RegExp(`${L}рф${R}`, "i"),
    ],
  },
];

const NORTH_CAUCASUS: CanonicalRegion[] = [
  "Дагестан",
  "Ставропольский край",
  "Чечня",
  "Ингушетия",
  "Кабардино-Балкария",
  "Северная Осетия",
  "Карачаево-Черкесия",
  "СКФО",
];

function cityHit(text: string, cities?: string[]): boolean {
  if (!cities?.length) return false;
  const t = text.toLowerCase();
  return cities.some((c) => {
    const re = new RegExp(`${L}${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}${R}`, "i");
    return re.test(t);
  });
}

/** Normalize free-text region to canonical label or null if unknown. */
export function normalizeRegionLabel(
  raw: string | null | undefined,
): CanonicalRegion | null {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(text)) || cityHit(text, rule.cities)) {
      return rule.canonical;
    }
  }
  return null;
}

/** Detect regions mentioned in a query / snippet (ordered, unique). */
export function detectCanonicalRegions(text: string): CanonicalRegion[] {
  const found: CanonicalRegion[] = [];
  for (const rule of RULES) {
    if (rule.canonical === "Россия") continue;
    if (rule.patterns.some((re) => re.test(text)) || cityHit(text, rule.cities)) {
      if (!found.includes(rule.canonical)) found.push(rule.canonical);
    }
  }
  if (!found.length) {
    if (/росси|по\s+росси|\brf\b|\bрф\b/i.test(text)) return ["Россия"];
    return ["Россия"];
  }
  return found;
}

/** True if candidate region matches need regions (canonical-aware). */
export function regionsCompatible(
  needRegions: string[],
  candidateRegion: string | null | undefined,
): boolean {
  if (!needRegions.length) return true;
  const needCanon = needRegions
    .map((r) => normalizeRegionLabel(r) || r.trim())
    .filter(Boolean);
  const cand = normalizeRegionLabel(candidateRegion);
  if (!cand) return false;
  for (const n of needCanon) {
    if (n === "Россия") return true;
    if (n === cand) return true;
    if (n === "СКФО" && NORTH_CAUCASUS.includes(cand)) return true;
    if (cand === "СКФО" && NORTH_CAUCASUS.includes(n as CanonicalRegion)) {
      return true;
    }
  }
  const cRaw = (candidateRegion || "").trim().toLowerCase();
  return needRegions.some((r) => {
    const nr = r.trim().toLowerCase();
    return nr.length >= 4 && cRaw.length >= 4 && (nr.includes(cRaw) || cRaw.includes(nr));
  });
}

export function isNorthCaucasus(region: string | null | undefined): boolean {
  const c = normalizeRegionLabel(region);
  return Boolean(c && NORTH_CAUCASUS.includes(c));
}

export function regionSearchTokens(regions: string[]): string[] {
  const out = new Set<string>();
  for (const r of regions) {
    const c = normalizeRegionLabel(r) || r;
    out.add(c);
    if (c === "Дагестан") {
      out.add("Республика Дагестан");
      out.add("Махачкала");
    }
    if (c === "СКФО") {
      out.add("Северо-Кавказский федеральный округ");
      out.add("Дагестан");
      out.add("Ставропольский край");
    }
  }
  return [...out];
}
