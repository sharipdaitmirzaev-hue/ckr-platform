import { oiHash, oiId } from "@/lib/lia/oi/id";
import type { InternetSearchHit } from "@/lib/lia/oi/internet/types";
import type { LiaOiCandidate, LiaOiClaim, LiaOiSourceRef } from "@/types/lia-oi";
import { emptyScore } from "@/lib/lia/oi/score";

export function canonicalUrl(url: string): string {
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
  const discoveredAt = hit.discoveredAt || now;
  const canonical = canonicalUrl(hit.url);
  const isStub = hit.isStub === true;

  const source: LiaOiSourceRef = {
    id: oiId("src"),
    category: hit.sourceCategory,
    name: hit.sourceName,
    url: hit.url,
    publishedAt: hit.publishedAt,
    discoveredAt,
    isStub,
  };

  const claims: LiaOiClaim[] = [
    {
      field: "title",
      value: hit.title,
      kind: "FACT",
      sourceName: hit.sourceName,
      sourceUrl: hit.url,
      note: isStub
        ? "Заголовок из stub-источника (demo)."
        : "Заголовок из выдачи поисковика (FACT относительно сниппета; не верификация объекта).",
    },
    {
      field: "source_url",
      value: hit.url,
      kind: "FACT",
      sourceName: hit.sourceName,
      sourceUrl: hit.url,
      note: "URL первоисточника.",
    },
  ];

  if (hit.askingPrice != null) {
    claims.push({
      field: "asking_price",
      value: String(hit.askingPrice),
      kind: "FACT",
      sourceName: hit.sourceName,
      sourceUrl: hit.url,
      note: isStub
        ? "Цена из stub-карточки."
        : "Число извлечено из текста сниппета/заголовка. Проверьте на странице источника.",
    });
  } else {
    claims.push({
      field: "asking_price",
      value: "не указано",
      kind: "UNKNOWN",
      sourceName: hit.sourceName,
      sourceUrl: hit.url,
      note: "Цена/инвестиции не найдены в доступном тексте.",
    });
  }

  if (hit.region) {
    claims.push({
      field: "region",
      value: hit.region,
      kind: "FACT",
      sourceName: hit.sourceName,
      sourceUrl: hit.url,
      note: "Локация упомянута в тексте результата.",
    });
  } else {
    claims.push({
      field: "region",
      value: "не указано",
      kind: "UNKNOWN",
      note: "Регион не извлечён из сниппета.",
    });
  }

  return {
    id: oiId("cand"),
    type: hit.tags?.[0] ?? (isStub ? "opportunity_signal" : "web_opportunity"),
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
    contactPhone: hit.contactPhone,
    contactEmail: hit.contactEmail,
    sources: [source],
    claims,
    risks: [],
    unknowns: [],
    toVerify: [],
    score: emptyScore(),
    matchHints: [],
    firstSeenAt: discoveredAt,
    lastSeenAt: now,
    canonicalKey: oiHash(canonical.toLowerCase()),
    rawStubIds: isStub ? [hit.id] : [],
    isStub,
  };
}
