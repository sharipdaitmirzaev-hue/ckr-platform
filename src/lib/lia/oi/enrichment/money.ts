/**
 * Careful money normalization — do not confuse revenue/profit/NMCK/subsidy/price.
 */

import type { LiaOiPriceKind } from "@/types/lia-oi";

export type NormalizedMoney = {
  amountRub: number;
  kind: LiaOiPriceKind;
  raw: string;
  currency: "RUB" | "UNKNOWN";
};

function parseNumberToken(raw: string): number | null {
  const cleaned = raw
    .replace(/\u00a0/g, " ")
    .replace(/\s/g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function applyScale(n: number, scaleWord?: string): number {
  const s = (scaleWord || "").toLowerCase();
  if (/млрд|billion/.test(s)) return Math.round(n * 1_000_000_000);
  if (/млн|миллион|million/.test(s)) return Math.round(n * 1_000_000);
  if (/тыс|thousand/.test(s)) return Math.round(n * 1_000);
  return Math.round(n);
}

const AMOUNT =
  /(\d{1,3}(?:[ \u00a0]\d{3})+|\d+(?:[.,]\d+)?)\s*(млрд|млн|миллион(?:ов|а)?|тыс(?:яч(?:и|а)?)?)?\s*(?:₽|руб\.?|RUB)?/i;

/** Cyrillic-safe “word” tail — JS \w without /u is ASCII-only. */
const CW = "[а-яёa-z]*";

function classifyKind(context: string, hint?: LiaOiPriceKind): LiaOiPriceKind {
  if (hint && hint !== "UNKNOWN") return hint;
  const c = context.toLowerCase();
  if (new RegExp(`нмцк|начальн${CW}\\s+максимальн${CW}\\s+цен`, "i").test(c)) {
    return "NMCK";
  }
  if (
    new RegExp(
      `текущ${CW}\\s+цен|текущ${CW}\\s+ставк|последн${CW}\\s+ставк`,
      "i",
    ).test(c)
  ) {
    return "CURRENT_AUCTION_PRICE";
  }
  if (
    new RegExp(`начальн${CW}\\s*цен|стартов${CW}\\s*цен|цена\\s+лот`, "i").test(
      c,
    )
  ) {
    return "STARTING_AUCTION_PRICE";
  }
  if (/субсид|грант|объ[её]м\s+поддерж|размер\s+поддерж|сумма\s+поддерж/.test(c)) {
    return "SUPPORT_AMOUNT";
  }
  if (new RegExp(`инвестиц|требуетс${CW}\\s+вложен`, "i").test(c)) {
    return "INVESTMENT_REQUIRED";
  }
  if (/выручк|оборот|прибыл/.test(c)) return "UNKNOWN"; // never treat as asking
  if (/цен[аы]|стоимость|asking/.test(c)) return "ASKING_PRICE";
  return "UNKNOWN";
}

/** Extract money near a specific label. */
export function extractLabeledMoney(
  text: string,
  labelRe: RegExp,
  hint?: LiaOiPriceKind,
): NormalizedMoney | null {
  // Wrap label alternation so amount binds to the whole label group.
  const windowRe = new RegExp(
    `(?:${labelRe.source})[^\\d]{0,40}${AMOUNT.source}`,
    "i",
  );
  const m = text.match(windowRe);
  if (!m) return null;
  const n = parseNumberToken(m[1]);
  if (n == null) return null;
  const amountRub = applyScale(n, m[2]);
  if (amountRub <= 0) return null;
  const raw = m[0].slice(0, 80);
  const ctx = text.slice(
    Math.max(0, (m.index ?? 0) - 40),
    (m.index ?? 0) + raw.length + 40,
  );
  // Reject revenue/profit contexts unless explicitly support/nmck/auction labels
  if (/выручк|прибыл|оборот/i.test(ctx) && !/нмцк|начальн|субсид|грант|лот/i.test(ctx)) {
    return null;
  }
  const currency = /₽|руб|RUB/i.test(raw) ? "RUB" : "UNKNOWN";
  return {
    amountRub,
    kind: classifyKind(ctx, hint),
    raw,
    currency,
  };
}

/** Generic first plausible price (conservative). */
export function extractPrimaryMoney(
  text: string,
  preferredKinds: LiaOiPriceKind[] = [],
): NormalizedMoney | null {
  const attempts: Array<{ re: RegExp; hint: LiaOiPriceKind }> = [
    {
      re: new RegExp(`нмцк|начальн${CW}\\s+максимальн${CW}\\s+цен`, "i"),
      hint: "NMCK",
    },
    {
      re: new RegExp(
        `начальн${CW}\\s*цен|стартов${CW}\\s*цен|цена\\s+лот`,
        "i",
      ),
      hint: "STARTING_AUCTION_PRICE",
    },
    {
      re: new RegExp(`текущ${CW}\\s*цен|текущ${CW}\\s+ставк`, "i"),
      hint: "CURRENT_AUCTION_PRICE",
    },
    {
      re: /субсид|грант|размер\s+поддерж|объ[её]м\s+поддерж/i,
      hint: "SUPPORT_AMOUNT",
    },
    { re: /стоимость|цен[аы]\s+объект|продаж/i, hint: "ASKING_PRICE" },
  ];

  const ordered = [
    ...attempts.filter((a) => preferredKinds.includes(a.hint)),
    ...attempts.filter((a) => !preferredKinds.includes(a.hint)),
  ];

  for (const a of ordered) {
    const hit = extractLabeledMoney(text, a.re, a.hint);
    if (hit) return hit;
  }
  return null;
}
