/**
 * Natural language → Need Profile drafts (rule-based Stage 4A).
 * Always returns drafts for user confirmation — no auto-save.
 */

import type {
  NeedIntentType,
  NeedProfileDraft,
  ParseNeedDraftResult,
} from "@/types/need-profile";
import { INTENT_LABELS } from "@/types/need-profile";

function extractMillions(text: string): number | null {
  const m = text.match(
    /(\d+[.,]?\d*)\s*(млн|миллион(?:а|ов)?|m\b|млн\.?\s*₽|млн\.?\s*руб)/i,
  );
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 1_000_000);
}

function extractRegions(text: string): string[] {
  const lower = text.toLowerCase();
  const out: string[] = [];
  const map: Array<[RegExp, string]> = [
    [/дагестан/i, "Дагестан"],
    [/ставропол/i, "Ставропольский край"],
    [/краснодар|черномор|у моря|берег(?:у|а) моря/i, "Краснодарский край"],
    [/москв/i, "Москва"],
    [/татарстан|казан/i, "Татарстан"],
    [/по россии|по\s+рф|росси[яи]/i, "Россия"],
  ];
  for (const [re, label] of map) {
    if (re.test(lower) && !out.includes(label)) out.push(label);
  }
  return out;
}

function extractIndustries(text: string): string[] {
  const lower = text.toLowerCase();
  const out: string[] = [];
  const map: Array<[RegExp, string]> = [
    [/производств/i, "manufacturing"],
    [/гостиниц|отель|hotel|гостев/i, "hospitality"],
    [/строительств/i, "construction"],
    [/напитк|вод[аы]|beverage/i, "beverage"],
    [/недвижим|участ|соток|площадк|земл/i, "real-estate"],
    [/IT|saas|цифров/i, "it"],
  ];
  for (const [re, label] of map) {
    if (re.test(lower) && !out.includes(label)) out.push(label);
  }
  return out;
}

function draft(
  intentType: NeedIntentType,
  title: string,
  description: string,
  partial: Partial<NeedProfileDraft> & { reasoningSummary: string },
): NeedProfileDraft {
  return {
    intentType,
    title,
    description,
    budgetMin: partial.budgetMin ?? null,
    budgetMax: partial.budgetMax ?? null,
    currency: "RUB",
    regions: partial.regions ?? [],
    industries: partial.industries ?? [],
    keywords: partial.keywords ?? [],
    criteria: partial.criteria ?? {},
    confidence: partial.confidence ?? 70,
    reasoningSummary: partial.reasoningSummary,
    requiresConfirmation: true,
  };
}

/**
 * Parse free-text need into one or more confirmable drafts.
 */
export function parseNeedProfileDrafts(rawText: string): ParseNeedDraftResult {
  const text = (rawText || "").trim();
  if (!text) {
    return { drafts: [], contextGroupSuggested: false, rawText: text };
  }

  const lower = text.toLowerCase();
  const amount = extractMillions(text);
  const regions = extractRegions(text);
  const industries = extractIndustries(text);
  const drafts: NeedProfileDraft[] = [];

  const investLike =
    /влож|инвестир|есть\s+\d|капитал|хочу\s+влож/i.test(lower) &&
    !/ищу\s+инвестор/i.test(lower);
  const seekInvestment =
    /ищу\s+инвестор|нужн[аоы]\s+\d|привлечь\s+финанс|нужно\s+\d/i.test(lower);
  const buyBusiness = /купить\s+бизнес|приобрести\s+бизнес|готовый\s+бизнес/i.test(
    lower,
  );
  const sellBusiness = /продать\s+бизнес/i.test(lower);
  const seekBuyer =
    /ищем\s+(магазин|ресторан|гостиниц|дистриб|покупател)|поставляем|производим/i.test(
      lower,
    );
  const seekPartner = /партн[её]р/i.test(lower);
  const landPlot = /участ|соток|площадк|земл/i.test(lower);
  const hotel = /гостиниц|отель/i.test(lower);

  // Scenario A — INVEST
  if (investLike && !seekInvestment) {
    drafts.push(
      draft(
        "INVEST",
        INTENT_LABELS.INVEST,
        text,
        {
          budgetMax: amount,
          regions,
          industries: industries.length ? industries : ["manufacturing"],
          criteria: {
            ticket_max: amount,
            project_stage: null,
          },
          confidence: 85,
          reasoningSummary:
            "Распознан запрос на инвестирование капитала с бюджетом и географией.",
        },
      ),
    );
  }

  // Scenario B — SEEK_INVESTMENT
  if (seekInvestment && !landPlot) {
    drafts.push(
      draft("SEEK_INVESTMENT", INTENT_LABELS.SEEK_INVESTMENT, text, {
        budgetMax: amount,
        budgetMin: amount,
        regions,
        industries,
        criteria: {
          amount_needed: amount,
          investment_type: null,
        },
        confidence: 88,
        reasoningSummary: "Распознан запрос на привлечение инвестиций.",
      }),
    );
  }

  // Scenario C — SEEK_BUYER
  if (seekBuyer && !investLike) {
    drafts.push(
      draft("SEEK_BUYER", INTENT_LABELS.SEEK_BUYER, text, {
        regions: regions.length ? regions : ["Россия"],
        industries: industries.length ? industries : ["beverage"],
        criteria: {
          product: industries.includes("beverage") ? "напитки" : null,
        },
        confidence: 82,
        reasoningSummary: "Распознан запрос на поиск покупателей/каналов сбыта.",
      }),
    );
  }

  // Scenario D — land + hotel → SEEK_INVESTMENT + SEEK_PARTNER
  if (landPlot && (hotel || seekInvestment || seekPartner)) {
    const groupCriteria = {
      property_hint: "land",
      purpose: hotel ? "hotel_construction" : "development",
      area_sotki: (() => {
        const m = text.match(/(\d+)\s*соток/i);
        return m ? Number(m[1]) : null;
      })(),
    };
    drafts.push(
      draft("SEEK_INVESTMENT", INTENT_LABELS.SEEK_INVESTMENT, text, {
        budgetMax: amount,
        budgetMin: amount,
        regions,
        industries: industries.length
          ? industries
          : ["hospitality", "construction", "real-estate"],
        criteria: {
          amount_needed: amount,
          ...groupCriteria,
        },
        confidence: 80,
        reasoningSummary:
          "Участок + девелопмент: предложен intent поиска инвестора.",
      }),
    );
    drafts.push(
      draft("SEEK_PARTNER", INTENT_LABELS.SEEK_PARTNER, text, {
        regions,
        industries: industries.length
          ? industries
          : ["hospitality", "construction"],
        criteria: {
          partner_type: "developer_or_operator",
          what_i_offer: "land_plot",
          what_i_need: hotel ? "hotel_project_partner" : "development_partner",
          ...groupCriteria,
        },
        confidence: 78,
        reasoningSummary:
          "Участок + девелопмент: предложен связанный intent поиска партнёра.",
      }),
    );
  }

  if (buyBusiness) {
    drafts.push(
      draft("BUY_BUSINESS", INTENT_LABELS.BUY_BUSINESS, text, {
        budgetMax: amount,
        regions,
        industries,
        criteria: { budget: amount },
        confidence: 80,
        reasoningSummary: "Распознан запрос на покупку бизнеса.",
      }),
    );
  }

  if (sellBusiness) {
    drafts.push(
      draft("SELL_BUSINESS", INTENT_LABELS.SELL_BUSINESS, text, {
        budgetMax: amount,
        regions,
        industries,
        criteria: {},
        confidence: 80,
        reasoningSummary: "Распознан запрос на продажу бизнеса.",
      }),
    );
  }

  // Deduplicate by intentType (keep highest confidence)
  const byIntent = new Map<string, NeedProfileDraft>();
  for (const d of drafts) {
    const prev = byIntent.get(d.intentType);
    if (!prev || d.confidence > prev.confidence) byIntent.set(d.intentType, d);
  }
  const unique = Array.from(byIntent.values());

  if (unique.length === 0) {
    unique.push(
      draft("DEMAND", "Потребность (уточнить)", text, {
        regions,
        industries,
        keywords: text.split(/\s+/).slice(0, 8),
        confidence: 40,
        reasoningSummary:
          "Не удалось уверенно классифицировать — черновик общей потребности. Подтвердите и уточните тип.",
      }),
    );
  }

  return {
    drafts: unique,
    contextGroupSuggested: unique.length > 1,
    rawText: text,
  };
}

export function formatDraftConfirmation(drafts: NeedProfileDraft[]): string {
  return drafts
    .map((d, i) => {
      const budget =
        d.budgetMax != null
          ? `Бюджет: до ${(d.budgetMax / 1_000_000).toLocaleString("ru-RU")} млн ₽`
          : "Бюджет: не указан";
      return [
        `${i + 1}. ${INTENT_LABELS[d.intentType] || d.intentType}`,
        budget,
        `Регион: ${d.regions.join(", ") || "не указан"}`,
        `Отрасль: ${d.industries.join(", ") || "не указана"}`,
        d.reasoningSummary,
      ].join("\n");
    })
    .join("\n\n");
}
