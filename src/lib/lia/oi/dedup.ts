import {
  mergeSerperWithOfficial,
  sameOfficialIdentity,
} from "@/lib/lia/oi/sources/providers/merge";
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
 * Схлопывает дубликаты:
 * 1) одинаковый procurement_id / lot_id (Serper + Official API → одна карточка)
 * 2) canonicalKey + similarity title/price/region
 * Official fields имеют приоритет; provenance обоих источников сохраняется.
 */
export function dedupeCandidates(items: LiaOiCandidate[]): LiaOiCandidate[] {
  const groups: LiaOiCandidate[] = [];

  for (const item of items) {
    const byOfficial = groups.findIndex((g) => sameOfficialIdentity(g, item));
    if (byOfficial >= 0) {
      groups[byOfficial] = mergeSerperWithOfficial(groups[byOfficial]!, item);
      continue;
    }

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

    // Prefer official merge when one side looks structured-official
    if (
      existing.dataChannel === "OFFICIAL_API" ||
      item.dataChannel === "OFFICIAL_API" ||
      existing.dataChannel === "FIXTURE_DEMO" ||
      item.dataChannel === "FIXTURE_DEMO"
    ) {
      const idx = groups.indexOf(existing);
      groups[idx] = mergeSerperWithOfficial(existing, item);
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
