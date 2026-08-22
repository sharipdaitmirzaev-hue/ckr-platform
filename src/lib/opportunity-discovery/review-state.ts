/**
 * Stage 4O — per-request candidate review state WITHOUT new table.
 * Derived from ckr_request_events (append-only).
 *
 * Event types:
 *  CANDIDATE_REVIEW — meta: { item_type, item_id, state }
 *  CANDIDATE_SHARED — implies SHARED
 *
 * If this becomes too awkward in production ops, add
 * ckr_request_candidates (unique request_id + item_type + item_id).
 */

import type {
  CandidateReviewState,
  ClientFeedbackAction,
} from "@/lib/opportunity-discovery/types";

export type ReviewEventLike = {
  eventType: string;
  meta?: Record<string, unknown> | null;
  createdAt?: string;
};

export function reviewKey(itemType: string, itemId: string): string {
  return `${itemType}:${itemId}`;
}

export function deriveReviewStateMap(
  events: ReviewEventLike[],
): Map<string, CandidateReviewState> {
  const map = new Map<string, CandidateReviewState>();
  const ordered = [...events].sort((a, b) =>
    String(a.createdAt || "").localeCompare(String(b.createdAt || "")),
  );

  for (const ev of ordered) {
    const meta = ev.meta || {};
    const itemType = String(meta.item_type || meta.itemType || "");
    const itemId = String(meta.item_id || meta.itemId || "");
    if (!itemType || !itemId) continue;
    const key = reviewKey(itemType, itemId);

    if (ev.eventType === "CANDIDATE_SHARED") {
      map.set(key, "SHARED");
      continue;
    }
    if (ev.eventType === "CANDIDATE_REVIEW") {
      const state = String(meta.state || "CHECKING") as CandidateReviewState;
      map.set(key, state);
    }
  }
  return map;
}

export function applyReviewState<T extends { entityType: string; sourceEntityId: string; reviewState: CandidateReviewState }>(
  candidates: T[],
  events: ReviewEventLike[],
): T[] {
  const map = deriveReviewStateMap(events);
  return candidates.map((c) => {
    const key = reviewKey(c.entityType, c.sourceEntityId);
    // also try opportunity alias for published items
    const alt =
      map.get(key) ||
      map.get(reviewKey("opportunity", c.sourceEntityId)) ||
      map.get(reviewKey("lia_oi", c.sourceEntityId));
    return alt ? { ...c, reviewState: alt } : c;
  });
}

/** Map simple client feedback → feed_feedback style + review hint. */
export function mapClientFeedback(action: ClientFeedbackAction): {
  feedAction: "interested" | "not_interested" | "saved";
  reviewHint: CandidateReviewState;
  labelRu: string;
} {
  switch (action) {
    case "INTERESTED":
      return {
        feedAction: "interested",
        reviewHint: "ACTED_ON",
        labelRu: "Интересно",
      };
    case "NOT_SUITABLE":
      return {
        feedAction: "not_interested",
        reviewHint: "NOT_SUITABLE",
        labelRu: "Не подходит",
      };
    case "WANT_DETAILS":
      return {
        feedAction: "saved",
        reviewHint: "NEED_CLIENT_INFO",
        labelRu: "Хочу подробнее",
      };
  }
}

export const REVIEW_WITHOUT_MIGRATION_NOTE =
  "Stage 4O: review state хранится в ckr_request_events (CANDIDATE_REVIEW / CANDIDATE_SHARED). Новая таблица не создана.";
