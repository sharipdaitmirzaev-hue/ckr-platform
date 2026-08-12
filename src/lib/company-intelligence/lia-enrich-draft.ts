/**
 * Controlled LIA enrichment draft for a company — no auto-publish of facts.
 */

import type { Organization } from "@/types";
import type { LiaCompanyEnrichmentDraft } from "@/lib/company-intelligence/types";

/**
 * Build a draft search plan + empty findings scaffold.
 * Owner must review before any field write.
 */
export function buildLiaCompanyEnrichmentDraft(
  org: Organization,
): LiaCompanyEnrichmentDraft {
  const geo = org.region || org.city || "Россия";
  const name = org.legalName || org.name;
  const queries = [
    `"${name}" официальный сайт ${geo}`,
    org.inn ? `ИНН ${org.inn}` : `"${name}" ИНН ${geo}`,
    `"${name}" закупки ${geo}`,
    `"${name}" инвестиционный проект ${geo}`,
    siteQuery(org.website, "о компании продукты услуги"),
  ].filter(Boolean) as string[];

  const findings: LiaCompanyEnrichmentDraft["findings"] = [];
  if (org.website) {
    findings.push({
      field: "website",
      value: org.website,
      provenance: "FACT",
      sourceUrl: org.website,
      note: "Уже известно в карточке ЦКР",
    });
  }
  if (!org.inn) {
    findings.push({
      field: "inn",
      value: "UNKNOWN",
      provenance: "UNKNOWN",
      note: "Не выдумывать ИНН — только из публичного реестра/сайта",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    queries: queries.slice(0, 8),
    findings,
    autoPublish: false,
    status: "DRAFT",
  };
}

function siteQuery(website: string | undefined, tail: string): string | null {
  if (!website) return null;
  try {
    const host = new URL(
      website.startsWith("http") ? website : `https://${website}`,
    ).hostname;
    return `site:${host} ${tail}`;
  } catch {
    return null;
  }
}
