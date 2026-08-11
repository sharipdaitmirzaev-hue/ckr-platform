/**
 * Stage 2A.2 — explainable DETAIL validation.
 * URL-структура сама по себе не делает страницу DETAIL opportunity.
 */

import type { LiaOiCandidate, LiaOiPageType } from "@/types/lia-oi";

export type DetailValidation = {
  detailConfidence: number;
  signals: string[];
  missing: string[];
  /** Эффективный pageType после валидации. */
  effectivePageType: LiaOiPageType;
};

const LOT_ID_RE =
  /лот\s*№?\s*\d+|объявлени[ея]\s*№?\s*\d+|id[=/]\d{3,}|\b\d{5,}\b/i;
const OBJECT_NAME_RE =
  /прода[её]тся|продажа|лот\b|цех|завод|гостиниц|кафе|склад|участ|франшиз|производств|бизнес\b/i;
const SPEC_RE =
  /площад|м²|кв\.?\s*м|выручк|прибыл|окупаем|сотрудник|мест\b|коек|номер/i;
const CTA_RE =
  /позвон|напишите|контакт|тел\.|whatsapp|оставить заявк|подробнее|купить/i;

/**
 * detail_confidence 0..100 по сигналам конкретного предложения.
 */
export function validateDetailOpportunity(
  candidate: Pick<
    LiaOiCandidate,
    | "title"
    | "description"
    | "region"
    | "city"
    | "askingPrice"
    | "investmentRequired"
    | "revenue"
    | "profit"
    | "paybackPeriod"
    | "area"
    | "contactPhone"
    | "contactEmail"
    | "contactsPublic"
    | "pageType"
    | "sources"
    | "isStub"
  >,
): DetailValidation {
  const blob = `${candidate.title} ${candidate.description}`;
  const url = candidate.sources[0]?.url ?? "";
  const signals: string[] = [];
  const missing: string[] = [];
  let score = 0;

  if (OBJECT_NAME_RE.test(candidate.title) || OBJECT_NAME_RE.test(blob)) {
    score += 18;
    signals.push("конкретное название/объект");
  } else {
    missing.push("конкретное название объекта");
  }

  if ((candidate.description || "").trim().length >= 80) {
    score += 14;
    signals.push("описание конкретного предложения");
  } else {
    missing.push("развёрнутое описание");
  }

  const price = candidate.investmentRequired ?? candidate.askingPrice;
  if (price != null && price > 0) {
    score += 18;
    signals.push("цена или сумма инвестиций");
  } else {
    missing.push("цена / инвестиции");
  }

  if (candidate.region || candidate.city) {
    score += 12;
    signals.push("регион/локация");
  } else {
    missing.push("регион/локация");
  }

  if (candidate.area || SPEC_RE.test(blob)) {
    score += 10;
    signals.push("характеристики объекта");
  } else {
    missing.push("характеристики объекта");
  }

  if (
    candidate.revenue != null ||
    candidate.profit != null ||
    candidate.paybackPeriod ||
    /выручк|прибыл|окупаем/i.test(blob)
  ) {
    score += 10;
    signals.push("финансовые показатели");
  } else {
    missing.push("финансовые показатели");
  }

  if (
    candidate.contactPhone ||
    candidate.contactEmail ||
    candidate.contactsPublic ||
    CTA_RE.test(blob)
  ) {
    score += 10;
    signals.push("контакт или CTA");
  } else {
    missing.push("публичный контакт / CTA");
  }

  if (LOT_ID_RE.test(blob) || /\/\d{3,}(\/|$)/.test(url)) {
    score += 8;
    signals.push("идентификатор объявления/лота");
  } else {
    missing.push("id объявления/лота");
  }

  if (candidate.isStub) {
    score = Math.min(100, score + 15);
    signals.push("stub demo card");
  }

  const detailConfidence = Math.max(0, Math.min(100, Math.round(score)));

  // URL DETAIL без сигналов → понижаем
  let effectivePageType = candidate.pageType;
  if (candidate.pageType === "DETAIL" && detailConfidence < 40) {
    effectivePageType = "UNKNOWN";
  } else if (
    candidate.pageType !== "DETAIL" &&
    detailConfidence >= 55 &&
    !/(LIST|CATEGORY|HOMEPAGE)/.test(candidate.pageType)
  ) {
    effectivePageType = "DETAIL";
  }

  return { detailConfidence, signals, missing, effectivePageType };
}
