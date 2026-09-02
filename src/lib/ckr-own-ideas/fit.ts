/**
 * Stage 4Q.2 / 4Q.3 — pair only compatible industry/region DETAIL signals.
 * Empty result is valid. No Matching Engine.
 */
import {
  geoCompatibility,
  industryKeyOf,
  industriesCompatibleKeys,
  normalizeOwnIdeaGeo,
  pairCompatibility,
} from "@/lib/ckr-own-ideas/quality-gate";
import type { OwnIdeaSignal } from "@/types/ckr-own-ideas";

export function titleOverlap(a: string, b: string): boolean {
  const tokens = (s: string) =>
    s
      .toLowerCase()
      .replace(/ё/g, "е")
      .split(/[^a-z0-9а-я]+/i)
      .filter((t) => t.length > 3);
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
  return industryKeyOf(signal);
}

export function regionKey(region?: string | null): string | null {
  const geo = normalizeOwnIdeaGeo(region ?? null);
  if (geo.subject) return geo.subject;
  if (geo.city) return geo.city;
  if (geo.federalDistrict) return geo.federalDistrict;
  if (geo.country === "ru") return "ru_generic";
  return geo.raw ? geo.raw.slice(0, 24) : null;
}

export function industriesCompatible(a: string | null, b: string | null): boolean {
  return industriesCompatibleKeys(a, b);
}

export function signalsFit(
  a: OwnIdeaSignal,
  b: OwnIdeaSignal,
): { ok: boolean; reason: string } {
  const support =
    a.kind === "CAPITAL" ||
    b.kind === "CAPITAL" ||
    a.kind === "TEAM" ||
    b.kind === "TEAM";
  if (support) {
    const ia = industryKey(a);
    const ib = industryKey(b);
    if (ia && ib && !industriesCompatible(ia, ib)) {
      return { ok: false, reason: "industry_mismatch" };
    }
    return { ok: true, reason: "support_attach" };
  }
  const fit = pairCompatibility(a, b);
  return { ok: fit.ok, reason: fit.reason };
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

export { geoCompatibility };
