/**
 * Cheap filtering live/stub hits до normalize/LLM.
 * Не ходит в сеть и не вызывает LLM.
 */

import { extractMoneyFromText } from "@/lib/lia/oi/extract";
import type { InternetSearchHit } from "@/lib/lia/oi/internet/types";

export type FilterStats = {
  input: number;
  droppedEmpty: number;
  droppedUrl: number;
  droppedJunk: number;
  droppedBudget: number;
  kept: number;
};

const JUNK_RE =
  /login|signin|cart|cookie|privacy|terms of service|войти|регистрация|корзина/i;

function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Лёгкий фильтр: пустые, bad URL, junk, грубый бюджетный отсев.
 * Бюджет: отбрасываем только если цена ЯВНО в тексте и сильно выше лимита.
 */
export function cheapFilterHits(
  hits: InternetSearchHit[],
  options?: { budgetMax?: number | null },
): { hits: InternetSearchHit[]; stats: FilterStats } {
  const stats: FilterStats = {
    input: hits.length,
    droppedEmpty: 0,
    droppedUrl: 0,
    droppedJunk: 0,
    droppedBudget: 0,
    kept: 0,
  };

  const out: InternetSearchHit[] = [];
  for (const hit of hits) {
    if (!hit.title?.trim() || !hit.url?.trim()) {
      stats.droppedEmpty += 1;
      continue;
    }
    if (!isHttpUrl(hit.url)) {
      stats.droppedUrl += 1;
      continue;
    }
    const blob = `${hit.title} ${hit.snippet}`;
    if (JUNK_RE.test(blob) && blob.length < 80) {
      stats.droppedJunk += 1;
      continue;
    }

    const budgetMax = options?.budgetMax ?? null;
    if (budgetMax != null) {
      const money =
        hit.investmentRequired ??
        hit.askingPrice ??
        extractMoneyFromText(blob)?.amount ??
        null;
      if (money != null && money > budgetMax * 1.8) {
        stats.droppedBudget += 1;
        continue;
      }
    }

    out.push(hit);
  }

  stats.kept = out.length;
  return { hits: out, stats };
}
