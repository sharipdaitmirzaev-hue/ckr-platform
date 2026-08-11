import type { NeedProfile } from "@/types/need-profile";
import { INTENT_LABELS } from "@/types/need-profile";
import type {
  FeedCandidate,
  FeedExplanation,
  ScoreBreakdown,
} from "@/types/personalized-feed";

function formatMoney(n: number | null | undefined): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)} млн ₽`;
  }
  return `${Math.round(n).toLocaleString("ru-RU")} ₽`;
}

export function needSummary(need: NeedProfile): string {
  const label =
    INTENT_LABELS[need.intentType as keyof typeof INTENT_LABELS] ||
    need.title ||
    need.intentType;
  const parts = [label];
  if (need.budgetMax != null) {
    parts.push(`до ${formatMoney(need.budgetMax)}`);
  }
  if (need.industries.length) parts.push(need.industries.join(", "));
  if (need.regions.length) parts.push(need.regions.join(", "));
  return parts.filter(Boolean).join(" · ");
}

export function explainRecommendation(
  need: NeedProfile,
  candidate: FeedCandidate,
  breakdown: ScoreBreakdown,
  budgetNote: string | null,
): FeedExplanation {
  const matched: string[] = [];
  const toVerify: string[] = [];
  const notes: string[] = [];

  if (breakdown.industryFit >= 12 && need.industries.length) {
    matched.push(need.industries.join(", "));
  } else if (need.industries.length && candidate.unknownFields.includes("industry")) {
    toVerify.push("отрасль не подтверждена");
  }

  if (breakdown.regionFit >= 12 && need.regions.length) {
    matched.push(candidate.region || need.regions[0]!);
  } else if (need.regions.length && candidate.unknownFields.includes("region")) {
    toVerify.push("регион не указан");
  }

  if (candidate.priceKnown && breakdown.budgetFit >= 12) {
    const p = formatMoney(candidate.price ?? candidate.priceMax ?? null);
    if (p) matched.push(`бюджет ${p}`);
  } else if (!candidate.priceKnown) {
    notes.push("Цена не подтверждена");
    toVerify.push("цена / условия");
  } else if (budgetNote) {
    notes.push(budgetNote);
  }

  if (candidate.sourceChannel === "external") {
    notes.push("Найдено Лией · внешняя возможность");
  }

  if (candidate.unknownFields.includes("profit")) {
    toVerify.push("прибыль");
  }
  if (candidate.unknownFields.includes("payback")) {
    toVerify.push("срок окупаемости");
  }

  const why = [
    `Подходит под вашу потребность: «${needSummary(need)}».`,
    matched.length ? `Совпало: ${matched.map((m) => `✓ ${m}`).join(" · ")}.` : "",
    toVerify.length ? `Нужно проверить: ${toVerify.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    needSummary: needSummary(need),
    matched,
    toVerify,
    notes,
    why,
  };
}
