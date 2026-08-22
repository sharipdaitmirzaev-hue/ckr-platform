/**
 * Stage 4M — client-facing cautious copy for shared demand signals.
 */

export function buildDemandClientShareMessage(input: {
  title: string;
  region: string | null;
  tier:
    | "CONFIRMED_DEMAND"
    | "STRONG_SIGNAL"
    | "POTENTIAL_BUYER"
    | "NEEDS_RESEARCH"
    | string;
  whyShort: string;
  sourceUrl?: string | null;
}): string {
  if (input.tier === "POTENTIAL_BUYER") {
    return [
      "ЦКР нашёл организацию, которая может быть потенциальным покупателем вашей продукции.",
      "",
      input.title,
      input.region ? `Регион: ${input.region}` : null,
      "",
      "Наличие текущей потребности требует проверки. Это не подтверждённый покупатель.",
      input.whyShort || null,
      input.sourceUrl ? `Источник: ${input.sourceUrl}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "ЦКР нашёл закупку / сигнал спроса, который может соответствовать вашему предложению.",
    "",
    input.title,
    input.region ? `Регион: ${input.region}` : null,
    "",
    input.whyShort ||
      "Мы рекомендуем проверить требования закупки. Это не означает, что найден подтверждённый покупатель.",
    "",
    "Рекомендуем проверить условия участия.",
    input.sourceUrl ? `Источник: ${input.sourceUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
