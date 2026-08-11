import type { Organization } from "@/types";
import type { CompanyCatalogFilter } from "@/lib/company-intelligence/types";

export function filterOrganizationsCatalog(
  orgs: Organization[],
  filter: CompanyCatalogFilter = {},
): Organization[] {
  const region = (filter.region || "").toLowerCase().trim();
  const industry = (filter.industry || "").toLowerCase().trim();
  const offers = (filter.offers || "").toLowerCase().trim();
  const seeks = (filter.seeks || "").toLowerCase().trim();
  const verification = (filter.verification || "").toLowerCase().trim();
  const q = (filter.q || "").toLowerCase().trim();
  const listedOnly = filter.listedOnly !== false;

  return orgs.filter((o) => {
    if (listedOnly && o.isListed === false) return false;
    // Public catalog: verified by default when listedOnly
    if (listedOnly && o.verificationStatus !== "verified") {
      // allow pending in admin callers by setting listedOnly=false
      return false;
    }
    if (region && !(o.region || "").toLowerCase().includes(region)) return false;
    if (industry && !(o.industry || "").toLowerCase().includes(industry)) {
      return false;
    }
    if (
      offers &&
      !`${o.offersSummary || ""} ${o.productsServices || ""}`
        .toLowerCase()
        .includes(offers)
    ) {
      return false;
    }
    if (seeks && !(o.seeksSummary || "").toLowerCase().includes(seeks)) {
      return false;
    }
    if (verification && o.verificationStatus !== verification) return false;
    if (q) {
      const blob =
        `${o.name} ${o.legalName || ""} ${o.industry || ""} ${o.region || ""} ${o.city || ""}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    return true;
  });
}

export function countOrganizationsByRegion(
  orgs: Organization[],
  region: string,
): number {
  const r = region.toLowerCase();
  return orgs.filter((o) => (o.region || "").toLowerCase().includes(r)).length;
}
