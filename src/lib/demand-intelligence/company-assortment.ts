/**
 * Stage 4N — company assortment sufficiency for product fit.
 * Does NOT mutate TINDA. INTERNAL recommendation only (no CLIENT message).
 */

export type AssortmentSufficiency = {
  sufficient: boolean;
  message: string;
  /** Fields staff should clarify with the client (INTERNAL). */
  recommendedFields: string[];
};

/**
 * Heuristic: do we know enough about the org offer to judge product fit?
 * UNKNOWN → ask staff; never invent SKU.
 */
export function assessAssortmentSufficiency(input: {
  industries?: string[] | null;
  keywords?: string[] | null;
  offerSummary?: string | null;
  knownCategories?: string[] | null;
}): AssortmentSufficiency {
  const signals = [
    ...(input.industries || []),
    ...(input.keywords || []),
    ...(input.knownCategories || []),
    input.offerSummary || "",
  ]
    .join(" ")
    .toLowerCase();

  const hasBeverageOrFood =
    /food|beverage|напит|продукт|вод|сок|чай|кофе|бакалея|пищев/.test(signals);
  const hasConcreteSku =
    /sku|бренд|ассортимент|минеральн|газиров|соки|чай|кофе|опт/.test(signals);

  if (!hasBeverageOrFood && !hasConcreteSku) {
    return {
      sufficient: false,
      message: "Недостаточно данных об ассортименте",
      recommendedFields: [
        "SKU / категории",
        "бренды",
        "минимальный объём / партия",
        "оптовые цены",
        "география доставки",
        "условия оплаты",
      ],
    };
  }

  if (hasBeverageOrFood && !hasConcreteSku) {
    return {
      sufficient: false,
      message: "Недостаточно данных об ассортименте",
      recommendedFields: [
        "конкретные категории (вода, соки, чай, бакалея…)",
        "бренды",
        "минимальная партия",
        "география доставки",
      ],
    };
  }

  return {
    sufficient: true,
    message: "Есть базовый сигнал по ассортименту (уточнение всё ещё полезно)",
    recommendedFields: ["минимальная партия", "география доставки"],
  };
}

/** INTERNAL note for staff — never send as CLIENT message. */
export function buildInternalAssortmentRecommendation(orgName: string): string {
  return [
    `INTERNAL · ${orgName}`,
    "Рекомендуется уточнить у клиента (не отправлять автоматически):",
    "— SKU / категории;",
    "— бренды;",
    "— минимальный объём / партия;",
    "— оптовые цены;",
    "— география доставки;",
    "— условия оплаты.",
  ].join("\n");
}
