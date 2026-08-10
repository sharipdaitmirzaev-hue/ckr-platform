import { oiHash, oiId } from "@/lib/lia/oi/id";
import type { InternetSearchHit } from "@/lib/lia/oi/internet/types";
import type { LiaOiCandidate, LiaOiSourceRef } from "@/types/lia-oi";
import { emptyScore } from "@/lib/lia/oi/score";

function canonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    u.hostname = u.hostname.replace(/^www\./, "");
    return u.toString().replace(/\/$/, "");
  } catch {
    return url.split("?")[0] ?? url;
  }
}

/** Hit → черновик OpportunityCandidate (без финального анализа/score). */
export function normalizeHit(hit: InternetSearchHit): LiaOiCandidate {
  const now = new Date().toISOString();
  const canonical = canonicalUrl(hit.url);
  const source: LiaOiSourceRef = {
    id: oiId("src"),
    category: hit.sourceCategory,
    name: hit.sourceName,
    url: hit.url,
    publishedAt: hit.publishedAt,
    isStub: true,
  };

  return {
    id: oiId("cand"),
    type: hit.tags?.[0] ?? "opportunity_signal",
    title: hit.title,
    description: hit.snippet,
    summary: "",
    whyInteresting: [],
    recommendation: "",
    nextStep: "",
    status: "NEW",
    country: "RU",
    region: hit.region,
    city: hit.city,
    industry: hit.industry,
    askingPrice: hit.askingPrice ?? null,
    investmentRequired: hit.investmentRequired ?? null,
    sources: [source],
    claims: [
      {
        field: "title",
        value: hit.title,
        kind: "FACT",
        sourceName: hit.sourceName,
        sourceUrl: hit.url,
        note: "Заголовок из stub-источника (demo).",
      },
      {
        field: "asking_price",
        value:
          hit.askingPrice != null
            ? String(hit.askingPrice)
            : "не указано",
        kind: hit.askingPrice != null ? "FACT" : "UNKNOWN",
        sourceName: hit.sourceName,
        sourceUrl: hit.url,
      },
    ],
    risks: [],
    unknowns: [],
    toVerify: [],
    score: emptyScore(),
    matchHints: [],
    firstSeenAt: now,
    lastSeenAt: now,
    canonicalKey: oiHash(canonical.toLowerCase()),
    rawStubIds: [hit.id],
  };
}
