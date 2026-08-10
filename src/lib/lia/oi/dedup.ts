import type { LiaOiCandidate } from "@/types/lia-oi";

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\[stub\]/g, "")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim();
}

function titleSimilar(a: string, b: string): boolean {
  const ta = new Set(normalizeTitle(a).split(" ").filter((w) => w.length > 3));
  const tb = new Set(normalizeTitle(b).split(" ").filter((w) => w.length > 3));
  if (!ta.size || !tb.size) return false;
  let inter = 0;
  Array.from(ta).forEach((w) => {
    if (tb.has(w)) inter += 1;
  });
  const union = new Set(Array.from(ta).concat(Array.from(tb))).size;
  return inter / union >= 0.55;
}

/**
 * Схлопывает дубликаты: canonicalKey + similarity title/price/region.
 * Источники объединяются в одну карточку.
 */
export function dedupeCandidates(items: LiaOiCandidate[]): LiaOiCandidate[] {
  const groups: LiaOiCandidate[] = [];

  for (const item of items) {
    const existing = groups.find(
      (g) =>
        g.canonicalKey === item.canonicalKey ||
        (titleSimilar(g.title, item.title) &&
          (g.region ?? "") === (item.region ?? "") &&
          (g.askingPrice ?? null) === (item.askingPrice ?? null)),
    );

    if (!existing) {
      groups.push(item);
      continue;
    }

    existing.sources = [...existing.sources, ...item.sources];
    existing.rawStubIds = Array.from(
      new Set(existing.rawStubIds.concat(item.rawStubIds)),
    );
    existing.lastSeenAt = item.lastSeenAt;
    if (item.description.length > existing.description.length) {
      existing.description = item.description;
    }
  }

  return groups;
}
