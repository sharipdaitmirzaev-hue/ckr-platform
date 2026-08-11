/**
 * Stage 4D — minimal controlled industry aliases (shared).
 * Not a full ontology.
 */

export const INDUSTRY_ALIASES: Record<string, string[]> = {
  manufacturing: [
    "production",
    "manufacturing",
    "equipment",
    "industry",
    "производство",
    "производств",
    "завод",
    "цех",
  ],
  production: ["production", "manufacturing", "производство"],
  hospitality: ["tourism", "hospitality", "hotel", "ready_business", "гостиниц", "отел", "туризм"],
  tourism: ["tourism", "hospitality", "туризм"],
  beverage: [
    "beverage",
    "напитки",
    "безалкогольн",
    "вода",
    "розлив",
    "пищев",
    "fmcg",
    "food",
    "agriculture",
    "production",
    "trade",
  ],
  food: [
    "food",
    "beverage",
    "пищев",
    "продукт",
    "fmcg",
    "напит",
    "agriculture",
    "production",
  ],
  construction: ["construction", "real-estate", "premises", "land", "строител"],
  "real-estate": ["real-estate", "land", "premises", "construction", "недвижим"],
  it: ["it", "technology", "services", "цифр", "software"],
  agriculture: ["agriculture", "agro", "сельхоз", "агро"],
  energy: ["energy", "энерг"],
  trade: ["trade", "retail", "опт", "торгов"],
};

export function expandIndustry(tag: string): string[] {
  const key = tag.trim().toLowerCase();
  const aliases = INDUSTRY_ALIASES[key];
  if (aliases) return [key, ...aliases.map((a) => a.toLowerCase())];
  return [key];
}

export function industriesOverlap(
  needIndustries: string[],
  candidateText: string | null | undefined,
  candidateTags: string[] = [],
): boolean {
  if (!needIndustries.length) return true;
  const hay = `${candidateText || ""} ${candidateTags.join(" ")}`.toLowerCase();
  for (const ind of needIndustries) {
    for (const a of expandIndustry(ind)) {
      if (a.length >= 3 && hay.includes(a)) return true;
    }
  }
  return false;
}

/** Detect industry tags from free text (minimal). */
export function detectIndustryTags(text: string): string[] {
  const t = text.toLowerCase();
  const found: string[] = [];
  const checks: Array<[string, RegExp]> = [
    ["beverage", /напит|безалкогол|розлив|\bвод[аые]\b|fmcg/],
    ["food", /пищев|продукт(ы|ов)?\s+питан|еда\b/],
    ["manufacturing", /производ|завод|цех|оборудован/],
    ["hospitality", /гостиниц|отел|глэмп|туризм/],
    ["agriculture", /сельхоз|агро|фермер/],
    ["construction", /строител|недвижим/],
    ["it", /\bit\b|цифр|software|saas/],
    ["trade", /опт|розниц|торгов/],
    ["energy", /энерг|нефт|газ/],
  ];
  for (const [tag, re] of checks) {
    if (re.test(t) && !found.includes(tag)) found.push(tag);
  }
  return found;
}
