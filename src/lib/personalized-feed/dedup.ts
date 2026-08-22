import type { FeedCandidate } from "@/types/personalized-feed";
import { needHash } from "@/lib/need-profile/id";

export function candidateDedupKey(c: FeedCandidate): string {
  if (c.fingerprint) return `fp:${c.fingerprint}`;
  if (c.canonicalUrl) return `url:${c.canonicalUrl.toLowerCase()}`;
  const norm = [
    c.itemType,
    c.title.trim().toLowerCase().replace(/\s+/g, " "),
    (c.region || "").toLowerCase(),
    c.priceKnown && c.price != null ? String(c.price) : "",
  ].join("|");
  return `h:${needHash(norm)}`;
}

/** Keep highest-quality representative per key. */
export function dedupeCandidates(candidates: FeedCandidate[]): {
  unique: FeedCandidate[];
  removed: number;
} {
  const best = new Map<string, FeedCandidate>();
  for (const c of candidates) {
    const key = candidateDedupKey(c);
    const prev = best.get(key);
    if (!prev) {
      best.set(key, c);
      continue;
    }
    const prevScore = prev.dataQuality + prev.sourceConfidence;
    const nextScore = c.dataQuality + c.sourceConfidence;
    if (nextScore > prevScore) best.set(key, c);
    else if (
      nextScore === prevScore &&
      c.sourceChannel === "internal" &&
      prev.sourceChannel !== "internal"
    ) {
      best.set(key, c);
    }
  }
  const unique = Array.from(best.values());
  return { unique, removed: candidates.length - unique.length };
}
