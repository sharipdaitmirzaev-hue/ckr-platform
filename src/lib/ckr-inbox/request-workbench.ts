/**
 * Stage 4L — Request Workbench: demand candidates for an Inbox request.
 * Composes PersonalizedFeedService. No Matching Engine / no new tables.
 */

import {
  demandSignalKind,
  demandSignalStatusLabel,
  demandSignalTypeLabel,
} from "@/lib/personalized-feed/demand-signals";
import { getPersonalizedFeedService } from "@/lib/personalized-feed/service";
import { rowToNeed, type NeedProfileRow } from "@/lib/need-profile/mappers";
import { createClient } from "@/lib/supabase/server";
import type { FeedRecommendation } from "@/types/personalized-feed";

export type WorkbenchCandidateView = {
  recommendationId: string;
  itemType: string;
  itemId: string;
  title: string;
  summary: string;
  region: string | null;
  signalTypeLabel: string;
  signalStatusLabel: string;
  sourceLabel: string;
  why: string;
  matched: string[];
  toVerify: string[];
  score: number;
  qualityHint: string;
  href: string;
  canonicalUrl: string | null;
  rawType: string | null;
  shareable: boolean;
};

export type RequestWorkbenchResult = {
  needProfileId: string | null;
  needTitle: string | null;
  coverage: string | null;
  total: number;
  candidates: WorkbenchCandidateView[];
  emptyReason: string | null;
};

function qualityHint(score: number): string {
  if (score >= 70) return "Высокая релевантность";
  if (score >= 50) return "Средняя релевантность";
  if (score >= 35) return "Слабый сигнал";
  return "Низкая релевантность";
}

export function toWorkbenchView(
  rec: FeedRecommendation,
): WorkbenchCandidateView {
  const kind = demandSignalKind(rec.candidate);
  return {
    recommendationId: rec.recommendationId,
    itemType: rec.candidate.itemType,
    itemId: rec.candidate.id,
    title: rec.candidate.title,
    summary: (rec.candidate.summary || "").slice(0, 220),
    region: rec.candidate.region,
    signalTypeLabel: demandSignalTypeLabel(kind),
    signalStatusLabel: demandSignalStatusLabel(kind),
    sourceLabel: rec.candidate.sourceLabel,
    why: rec.explanation.why,
    matched: rec.explanation.matched,
    toVerify: rec.explanation.toVerify,
    score: rec.score,
    qualityHint: qualityHint(rec.score),
    href: rec.candidate.href,
    canonicalUrl: rec.candidate.canonicalUrl || null,
    rawType: rec.candidate.rawType || null,
    // Only published marketplace opportunities may be shared to client.
    shareable:
      rec.candidate.itemType === "opportunity" &&
      (rec.candidate.status || "").toLowerCase() === "published",
  };
}

/** Load top demand candidates for a CKR request's linked Need Profile. */
export async function getRequestWorkbench(input: {
  requestId: string;
  needProfileId: string | null;
  ownerUserId: string;
  limit?: number;
}): Promise<RequestWorkbenchResult> {
  if (!input.needProfileId) {
    return {
      needProfileId: null,
      needTitle: null,
      coverage: null,
      total: 0,
      candidates: [],
      emptyReason:
        "К обращению ещё не привязан Need Profile — создайте или свяжите потребность.",
    };
  }

  const supabase = createClient();
  const { data: needRow, error } = await supabase
    .from("need_profiles")
    .select("*")
    .eq("id", input.needProfileId)
    .maybeSingle();

  if (error || !needRow) {
    return {
      needProfileId: input.needProfileId,
      needTitle: null,
      coverage: null,
      total: 0,
      candidates: [],
      emptyReason: "Need Profile не найден или нет доступа.",
    };
  }

  const need = rowToNeed(needRow as NeedProfileRow);
  const feed = getPersonalizedFeedService();
  const { recommendations, diagnostics } = await feed.getFeedForNeedProfile({
    need,
    ownerId: input.ownerUserId,
    limit: input.limit ?? 5,
    excludeFixtures: true,
    // Stage 4L: avoid region-only weak listings (EIS catalogs without product fit).
    minScore: 50,
    requireProductFit:
      need.intentType === "SEEK_BUYER" || need.intentType === "SUPPLY",
  });

  return {
    needProfileId: need.id,
    needTitle: need.title,
    coverage: diagnostics.coverage,
    total: recommendations.length,
    candidates: recommendations.map(toWorkbenchView),
    emptyReason: recommendations.length
      ? null
      : "Пока нет опубликованных сигналов спроса, прошедших фильтр качества. Проверьте Controlled Publish / Opportunities.",
  };
}

/** Build CLIENT-visible message body for a shared published candidate. */
export function buildClientShareMessage(input: {
  title: string;
  signalTypeLabel: string;
  region: string | null;
  whyShort: string;
  sourceUrl?: string | null;
}): string {
  const lines = [
    "ЦКР нашёл вариант, который может быть вам интересен.",
    "",
    `${input.signalTypeLabel}: ${input.title}`,
    input.region ? `Регион: ${input.region}` : null,
    "",
    input.whyShort,
    "",
    "Это сигнал спроса / закупка — не подтверждённый покупатель. Рекомендуем проверить условия участия.",
    input.sourceUrl ? `Источник: ${input.sourceUrl}` : null,
  ].filter((x): x is string => Boolean(x));
  return lines.join("\n");
}
