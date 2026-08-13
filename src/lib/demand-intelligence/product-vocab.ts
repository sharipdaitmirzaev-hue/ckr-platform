/**
 * Stage 4M / 4N — product / demand vocabulary (extends Stage 4D aliases).
 * Not a full ontology. Shared by Feed scoring + demand discovery.
 * Stage 4N: tea/coffee/dairy + false-positive protection (meat/medical/specialized).
 */

/** Extra product tags beyond coarse industry (food/beverage). */
export const PRODUCT_ALIASES: Record<string, string[]> = {
  beverage: [
    "beverage",
    "напит",
    "безалкогол",
    "soft_drinks",
    "water",
    "juice",
    "energy_drinks",
    "tea",
    "coffee",
    "минеральн",
    "сок",
    "энергетик",
    "лимонад",
    "газиров",
    "чай",
    "кофе",
  ],
  water: ["water", "вода", "питьев", "минеральн", "розлив", "mineral_water"],
  mineral_water: ["mineral_water", "минеральн", "вода"],
  soft_drinks: ["soft_drinks", "безалкогол", "газиров", "лимонад", "напит"],
  juice: ["juice", "сок", "нектар"],
  energy_drinks: ["energy_drinks", "энергетик"],
  tea: ["tea", "чай", "чаепитие", "чайный"],
  coffee: ["coffee", "кофе", "кофейн"],
  dairy: ["dairy", "молочн", "молоко", "кефир", "йогурт", "сыр"],
  food: [
    "food",
    "продукт",
    "пищев",
    "питан",
    "grocery",
    "еда",
    "бакалея",
  ],
  grocery: ["grocery", "бакалея", "продукт", "food"],
  horeca_supply: [
    "horeca",
    "horeca_supply",
    "гостиниц",
    "отел",
    "ресторан",
    "кафе",
    "кейтеринг",
    "санатор",
    "питание",
    "столов",
  ],
  food_service_supply: [
    "food_service_supply",
    "общепит",
    "столов",
    "питание",
    "кейтеринг",
  ],
};

/** Subjects that look like "food" but are usually a poor fit for beverage wholesalers. */
const FOOD_FALSE_POSITIVE_RE =
  /мяс[оа]|говядин|свинин|птиц[аы]|медицинск\w*\s+питан|лечебн\w*\s+питан|специализированн\w*\s+(?:детск\w*\s+)?питан|энтеральн|смес[иь]\s+для\s+дет|парентеральн/i;

export function expandProductTag(tag: string): string[] {
  const key = tag.trim().toLowerCase();
  const aliases = PRODUCT_ALIASES[key];
  if (aliases) return [key, ...aliases.map((a) => a.toLowerCase())];
  return [key];
}

/** Detect product tags from free text. */
export function detectProductTags(text: string): string[] {
  const t = text.toLowerCase();
  const found: string[] = [];
  const checks: Array<[string, RegExp]> = [
    ["water", /\bвод[аыеуи]\b|питьев|минеральн/],
    ["mineral_water", /минеральн\w*\s*вод/],
    ["juice", /\bсок(и|ов)?\b|нектар/],
    ["energy_drinks", /энергетик/],
    ["tea", /(?:^|[^а-яёa-z])ча[йяюе](?:[^а-яёa-z]|$)|чаепитие|чайный/i],
    ["coffee", /(?:^|[^а-яёa-z])кофе(?:[^а-яёa-z]|$)|кофейн/i],
    ["dairy", /молочн|молоко\b|кефир|йогурт|\bсыр\b/],
    ["soft_drinks", /безалкогол|газиров|лимонад|напитк/],
    ["beverage", /напит|безалкогол|розлив|fmcg/],
    ["food", /пищев|продукт(ы|ов)?\s+питан|бакалея|еда\b|питани/],
    ["grocery", /бакалея|продуктов\s+питани/],
    [
      "horeca_supply",
      /horeca|гостиниц|отел|ресторан|кафе|кейтеринг|санатор|столов/,
    ],
    ["food_service_supply", /общепит|кейтеринг|столов/],
  ];
  for (const [tag, re] of checks) {
    if (re.test(t) && !found.includes(tag)) found.push(tag);
  }
  return found;
}

export function isFoodFalsePositiveForBeverageWholesale(text: string): boolean {
  return FOOD_FALSE_POSITIVE_RE.test(text);
}

/**
 * Product fit for SEEK_BUYER needs — returns 0–18 and matched tags.
 * UNKNOWN when no product signal on candidate.
 */
export function productFitScore(
  needIndustries: string[],
  needKeywords: string[],
  candidateText: string,
): { score: number; matched: string[]; unknown: boolean } {
  const needTags = new Set<string>();
  for (const ind of needIndustries) {
    for (const a of expandProductTag(ind)) needTags.add(a);
  }
  for (const kw of needKeywords) {
    for (const a of expandProductTag(kw)) needTags.add(a);
    if (kw.length >= 3) needTags.add(kw.toLowerCase());
  }
  // Default food/beverage expansion when need is food supplier
  if (
    needIndustries.some((i) => /food|beverage|пищев|напит/i.test(i)) ||
    needKeywords.some((k) => /напит|продукт|вод|чай|кофе/i.test(k))
  ) {
    for (const t of [
      "food",
      "beverage",
      "water",
      "mineral_water",
      "soft_drinks",
      "juice",
      "tea",
      "coffee",
      "dairy",
      "grocery",
      "horeca_supply",
      "food_service_supply",
    ]) {
      for (const a of expandProductTag(t)) needTags.add(a);
    }
  }

  if (!needTags.size) {
    return { score: 8, matched: [], unknown: false };
  }

  const hay = candidateText.toLowerCase();

  // False-positive: specialized/meat/medical food for beverage-oriented needs
  const beverageOriented =
    needIndustries.some((i) => /beverage|напит/i.test(i)) ||
    needKeywords.some((k) => /напит|вод|сок|чай|кофе/i.test(k));
  if (
    beverageOriented &&
    isFoodFalsePositiveForBeverageWholesale(candidateText) &&
    !/\b(чай|кофе|сок|напит|вод[аыеуи]|безалкогол)\b/i.test(hay)
  ) {
    return { score: 2, matched: [], unknown: false };
  }

  const candTags = detectProductTags(candidateText);
  const matched: string[] = [];

  for (const tag of candTags) {
    const aliases = expandProductTag(tag);
    if ([...needTags].some((n) => aliases.includes(n) || n.includes(tag))) {
      matched.push(tag);
    }
  }
  for (const n of needTags) {
    if (n.length >= 4 && hay.includes(n) && !matched.includes(n)) {
      matched.push(n);
    }
  }

  if (matched.length) {
    const strong =
      matched.some((m) =>
        /food|beverage|water|soft_drinks|juice|tea|coffee|dairy|продукт|напит|вод|чай|кофе|молоч/.test(
          m,
        ),
      ) &&
      /продукт|напит|вод|пищев|питан|безалкогол|ча[йяюе]|кофе|молоч|сок/i.test(
        hay,
      );
    return {
      score: strong ? 18 : 14,
      matched: matched.slice(0, 6),
      unknown: false,
    };
  }

  if (
    !candTags.length &&
    !/продукт|напит|вод|пищев|питан|закуп|тендер|чай|кофе/i.test(hay)
  ) {
    return { score: 0, matched: [], unknown: true };
  }
  return { score: 3, matched: [], unknown: false };
}
