/**
 * Stage 4Q.2 — pair only compatible industry/region signals.
 * Empty result is valid. No Matching Engine.
 */
import type { OwnIdeaSignal } from "@/types/ckr-own-ideas";

const INDUSTRY_ALIASES: Record<string, string> = {
  construction: "construction",
  строитель: "construction",
  земля: "construction",
  экскаватор: "construction",
  спецтех: "construction",
  tourism: "tourism",
  туризм: "tourism",
  гостиниц: "tourism",
  турбаз: "tourism",
  hospitality: "tourism",
  food: "food",
  пищев: "food",
  консерв: "food",
  продукт: "food",
  напиток: "food",
  warehouse: "warehouse",
  склад: "warehouse",
  ритейл: "warehouse",
  retail: "warehouse",
};

const COMPATIBLE: Record<string, string[]> = {
  construction: ["construction"],
  tourism: ["tourism"],
  food: ["food"],
  warehouse: ["warehouse"],
};

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .split(/[^a-z0-9а-я]+/i)
    .filter((t) => t.length > 3);
}

export function titleOverlap(a: string, b: string): boolean {
  const A = tokens(a);
  const B = tokens(b);
  return B.some((bt) =>
    A.some((at) => {
      if (at === bt) return true;
      if (at.length >= 5 && bt.length >= 5 && (at.startsWith(bt.slice(0, 5)) || bt.startsWith(at.slice(0, 5)))) {
        return true;
      }
      return false;
    }),
  );
}

export function industryKey(signal: Pick<OwnIdeaSignal, "industry" | "title" | "tags">): string | null {
  const raw = (signal.industry || "").trim().toLowerCase();
  if (raw && INDUSTRY_ALIASES[raw]) return INDUSTRY_ALIASES[raw];
  if (raw) {
    for (const [alias, key] of Object.entries(INDUSTRY_ALIASES)) {
      if (raw.includes(alias)) return key;
    }
  }
  const blob = `${signal.title || ""} ${(signal.tags || []).join(" ")}`.toLowerCase();
  for (const [alias, key] of Object.entries(INDUSTRY_ALIASES)) {
    if (blob.includes(alias)) return key;
  }
  return null;
}

export function regionKey(region?: string | null): string | null {
  if (!region) return null;
  const t = region.toLowerCase().replace(/ё/g, "е");
  if (/дагестан|махачкал|каспийск|избербаш|дербент/.test(t)) return "dagestan";
  if (/скфо|северо.?кавказ|чечн|ингуш|осетия|кабардин|ставропол/.test(t)) return "skfo";
  if (/россия|рф|russia/.test(t)) return "ru";
  return t.slice(0, 24);
}

function regionsCompatible(a: string | null, b: string | null): boolean {
  if (!a || !b) return true;
  if (a === b) return true;
  if ((a === "dagestan" && b === "skfo") || (a === "skfo" && b === "dagestan")) return true;
  if (a === "ru" || b === "ru") return true;
  return false;
}

export function industriesCompatible(a: string | null, b: string | null): boolean {
  if (!a || !b) return true;
  if (a === b) return true;
  return (COMPATIBLE[a] || []).includes(b);
}

export function signalsFit(
  a: OwnIdeaSignal,
  b: OwnIdeaSignal,
): { ok: boolean; reason: string } {
  const ia = industryKey(a);
  const ib = industryKey(b);
  if (ia && ib && !industriesCompatible(ia, ib)) {
    return { ok: false, reason: "industry_mismatch" };
  }
  const ra = regionKey(a.region);
  const rb = regionKey(b.region);
  if (!regionsCompatible(ra, rb)) {
    return { ok: false, reason: "region_mismatch" };
  }
  if (ia && ib && industriesCompatible(ia, ib)) return { ok: true, reason: "industry" };
  if (titleOverlap(a.title, b.title)) return { ok: true, reason: "title_overlap" };
  if (ia && ib) return { ok: true, reason: "industry" };
  return { ok: false, reason: "weak_link" };
}

export function pairFits(pair: OwnIdeaSignal[]): boolean {
  if (pair.length < 2) return false;
  return signalsFit(pair[0], pair[1]).ok;
}

export function signalFitsContext(
  candidate: OwnIdeaSignal,
  context: OwnIdeaSignal[],
): boolean {
  if (!context.length) return true;
  return context.every((c) => signalsFit(c, candidate).ok);
}
