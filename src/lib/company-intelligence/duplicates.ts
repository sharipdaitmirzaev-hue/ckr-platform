/**
 * Company identity: INN / OGRN / domain stronger than name.
 * Never merge on name similarity alone.
 */

import type { Organization } from "@/types";

export function normalizeInn(raw?: string | null): string | null {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 12) return digits;
  return null;
}

export function normalizeOgrn(raw?: string | null): string | null {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 13 || digits.length === 15) return digits;
  return null;
}

export function domainFromWebsite(website?: string | null): string | null {
  const w = (website || "").trim();
  if (!w) return null;
  try {
    const u = new URL(w.startsWith("http") ? w : `https://${w}`);
    return u.hostname.replace(/^www\./i, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

export type CompanyIdentityMatch = {
  kind: "inn" | "ogrn" | "domain" | "none";
  matchedId?: string;
  canAutoMerge: boolean;
};

/**
 * Find strong identity collision among existing orgs.
 * Name-only similarity is ignored (no auto-merge).
 */
export function findCompanyDuplicate(
  candidate: Pick<Organization, "id" | "inn" | "ogrn" | "website" | "name">,
  existing: Organization[],
): CompanyIdentityMatch {
  const inn = normalizeInn(candidate.inn);
  const ogrn = normalizeOgrn(candidate.ogrn);
  const domain = domainFromWebsite(candidate.website);

  for (const o of existing) {
    if (candidate.id && o.id === candidate.id) continue;
    if (inn && normalizeInn(o.inn) === inn) {
      return { kind: "inn", matchedId: o.id, canAutoMerge: true };
    }
    if (ogrn && normalizeOgrn(o.ogrn) === ogrn) {
      return { kind: "ogrn", matchedId: o.id, canAutoMerge: true };
    }
  }
  if (domain) {
    for (const o of existing) {
      if (candidate.id && o.id === candidate.id) continue;
      if (domainFromWebsite(o.website) === domain) {
        return { kind: "domain", matchedId: o.id, canAutoMerge: false };
      }
    }
  }
  return { kind: "none", canAutoMerge: false };
}
