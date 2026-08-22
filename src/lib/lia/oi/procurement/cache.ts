/**
 * Stage 4N — in-process DETAIL cache (no new table).
 * discoveredAt lives on OI candidate; fetchedAt/verifiedAt here.
 */

import type { ResolvedProcurementDetail } from "@/lib/lia/oi/procurement/types";

type CacheEntry = {
  detail: ResolvedProcurementDetail;
  fetchedAt: string;
  expiresAtMs: number;
};

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const store = new Map<string, CacheEntry>();

export function getCachedProcurementDetail(
  noticeId: string,
): ResolvedProcurementDetail | null {
  const hit = store.get(noticeId);
  if (!hit) return null;
  if (Date.now() > hit.expiresAtMs) {
    store.delete(noticeId);
    return null;
  }
  return hit.detail;
}

export function setCachedProcurementDetail(
  detail: ResolvedProcurementDetail,
  ttlMs = DEFAULT_TTL_MS,
): void {
  store.set(detail.noticeId, {
    detail,
    fetchedAt: detail.fetchedAt,
    expiresAtMs: Date.now() + ttlMs,
  });
}

/** Test helper */
export function resetProcurementDetailCache(): void {
  store.clear();
}
