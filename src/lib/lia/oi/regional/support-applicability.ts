/**
 * Stage 4E — federal vs regional support applicability.
 * Federal programs must not invent region=Dagestan FACT.
 */

import type { LiaOiCandidate } from "@/types/lia-oi";
import { normalizeRegionLabel } from "@/lib/geo/region-normalize";

const FEDERAL_DOMAINS =
  /corpmsp\.ru|мсп\.рф|xn--|economy\.gov\.ru|minpromtorg\.gov\.ru|mcx\.gov\.ru|smb\.gov\.ru|фрп\.рф|rftr\.ru/i;

const REGIONAL_DAGESTAN =
  /e-dag\.ru|mb05\.ru|cppdag\.ru|mcxrd\.ru|dagestaninvest\.ru|mspinvestrd\.ru|krd-rd\.ru|minec\.|minprom\./i;

export type SupportApplicability = {
  regionApplicability: string;
  regionFact: string | null;
  isFederal: boolean;
  notes: string[];
};

/**
 * Compute honest applicability for SUPPORT_PROGRAM-like candidates.
 */
export function computeSupportApplicability(input: {
  title: string;
  description?: string;
  url?: string;
  region?: string | null;
  opportunityType?: string | null;
}): SupportApplicability {
  const notes: string[] = [];
  const url = input.url || "";
  const blob = `${input.title} ${input.description || ""}`;
  const regionCanon = normalizeRegionLabel(input.region);

  const isFederalDomain = FEDERAL_DOMAINS.test(url);
  const isRegionalDomain = REGIONAL_DAGESTAN.test(url);
  const mentionsFederal =
    /федеральн|по всей\s+росс|на\s+территории\s+рф|корп(?:ораци[яи])?\s+мсп|мсп\.рф/i.test(
      blob,
    );
  const mentionsDagestan = /дагестан|махачкал/i.test(blob);

  if (isFederalDomain || (mentionsFederal && !isRegionalDomain)) {
    notes.push("federal_program");
    if (mentionsDagestan || regionCanon === "Дагестан") {
      return {
        regionApplicability: "Russia/Dagestan applicable",
        regionFact: regionCanon === "Дагестан" && isRegionalDomain ? "Дагестан" : "Россия",
        isFederal: true,
        notes: [...notes, "applicable_in_dagestan_not_region_fact"],
      };
    }
    return {
      regionApplicability: "Russia applicable",
      regionFact: "Россия",
      isFederal: true,
      notes,
    };
  }

  if (isRegionalDomain || regionCanon === "Дагестан") {
    notes.push("regional_program");
    return {
      regionApplicability: "Dagestan",
      regionFact: "Дагестан",
      isFederal: false,
      notes,
    };
  }

  if (regionCanon === "СКФО" || /скфо|северо.?кавказ/i.test(blob)) {
    return {
      regionApplicability: "SKFO",
      regionFact: regionCanon || "СКФО",
      isFederal: false,
      notes: ["skfo_scope"],
    };
  }

  return {
    regionApplicability: regionCanon || input.region || "UNKNOWN",
    regionFact: regionCanon,
    isFederal: false,
    notes: ["unknown_scope"],
  };
}

export function attachSupportApplicability(
  candidate: LiaOiCandidate,
): LiaOiCandidate {
  if (
    candidate.opportunityType !== "SUPPORT_PROGRAM" &&
    !/субсид|грант|поддержк|льготн/i.test(
      `${candidate.title} ${candidate.description}`,
    )
  ) {
    return candidate;
  }
  const app = computeSupportApplicability({
    title: candidate.title,
    description: candidate.description,
    url: candidate.canonicalUrl || candidate.sources?.[0]?.url,
    region: candidate.region,
    opportunityType: candidate.opportunityType,
  });
  return {
    ...candidate,
    regionApplicability: app.regionApplicability,
    // Do not overwrite a confirmed Dagestan FACT with Russia for regional sources
    region:
      app.isFederal && candidate.region && normalizeRegionLabel(candidate.region) === "Дагестан"
        ? candidate.region
        : app.isFederal
          ? candidate.region || "Россия"
          : candidate.region,
  };
}
