import {
  AMOUNT_FILTERS,
  type AmountFilterId,
} from "@/config/investments";
import {
  getDemoInvestmentById,
  getDemoInvestments,
} from "@/lib/demo/catalog";
import { isDemoCatalogFallbackEnabled } from "@/lib/demo/mode";
import { mapInvestmentOfferRow } from "@/lib/investments/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { InvestmentOffer, Project } from "@/types";
import type { InvestmentOfferRow } from "@/types/database";

export type InvestmentOfferWithOwner = InvestmentOffer & {
  ownerName: string | null;
};

export type InvestmentCatalogFilters = {
  amount?: AmountFilterId | null;
  category?: string | null;
  type?: string | null;
  q?: string | null;
};

function overlapsAmount(
  offer: InvestmentOffer,
  amountId: AmountFilterId | null | undefined,
) {
  if (!amountId) return true;
  const filter = AMOUNT_FILTERS.find((item) => item.id === amountId);
  if (!filter) return true;

  const filterMax = filter.max ?? Number.POSITIVE_INFINITY;
  // пересечение диапазонов [offer.min, offer.max] и [filter.min, filterMax]
  return offer.amountMin <= filterMax && offer.amountMax >= filter.min;
}

export async function listPublishedInvestmentOffers(
  filters: InvestmentCatalogFilters = {},
): Promise<InvestmentOfferWithOwner[]> {
  const q = filters.q?.trim().toLowerCase() || null;

  const matchesQuery = (offer: InvestmentOffer) => {
    if (!q) return true;
    const hay = `${offer.title} ${offer.description}`.toLowerCase();
    return hay.includes(q);
  };

  const fromDemo = () =>
    getDemoInvestments()
      .filter((offer) =>
        filters.category
          ? offer.categories.includes(filters.category)
          : true,
      )
      .filter((offer) =>
        filters.type ? offer.investmentType === filters.type : true,
      )
      .filter((offer) => overlapsAmount(offer, filters.amount))
      .filter(matchesQuery);

  if (!hasSupabaseEnv()) {
    return isDemoCatalogFallbackEnabled() ? fromDemo() : [];
  }

  const supabase = createClient();
  let query = supabase
    .from("investment_offers")
    .select("*, profiles:owner_id ( full_name )")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(48); // CATALOG_LIST_LIMIT

  if (filters.category) {
    query = query.contains("categories", [filters.category]);
  }
  if (filters.type) {
    query = query.eq("investment_type", filters.type);
  }
  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    return isDemoCatalogFallbackEnabled() ? fromDemo() : [];
  }

  return data
    .map((row) => {
      const offer = mapInvestmentOfferRow(row as InvestmentOfferRow);
      const profiles = row.profiles as { full_name: string | null } | null;
      return {
        ...offer,
        ownerName: profiles?.full_name ?? null,
      };
    })
    .filter((offer) => overlapsAmount(offer, filters.amount))
    .filter((offer) =>
      filters.type ? offer.investmentType === filters.type : true,
    )
    .filter(matchesQuery);
}

export async function listMyInvestmentOffers(
  ownerId: string,
): Promise<InvestmentOffer[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("investment_offers")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return (data as InvestmentOfferRow[]).map(mapInvestmentOfferRow);
}

export async function getInvestmentOfferById(
  id: string,
): Promise<InvestmentOfferWithOwner | null> {
  if (!hasSupabaseEnv()) {
    return isDemoCatalogFallbackEnabled() ? getDemoInvestmentById(id) : null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("investment_offers")
    .select("*, profiles:owner_id ( full_name )")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return isDemoCatalogFallbackEnabled() ? getDemoInvestmentById(id) : null;
  }

  const offer = mapInvestmentOfferRow(data as InvestmentOfferRow);
  const profiles = data.profiles as { full_name: string | null } | null;

  return {
    ...offer,
    ownerName: profiles?.full_name ?? null,
  };
}

/** Инвестпредложения, потенциально подходящие проекту. */
export async function listMatchingInvestmentOffersForProject(
  project: Project,
  limit = 4,
): Promise<InvestmentOfferWithOwner[]> {
  if (!hasSupabaseEnv() || project.status !== "published") return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("investment_offers")
    .select("*, profiles:owner_id ( full_name )")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  return data
    .map((row) => {
      const offer = mapInvestmentOfferRow(row as InvestmentOfferRow);
      const profiles = row.profiles as { full_name: string | null } | null;
      return {
        ...offer,
        ownerName: profiles?.full_name ?? null,
      };
    })
    .filter((offer) => {
      const categoryOk =
        offer.categories.length === 0 ||
        offer.categories.includes(project.category);
      const amountOk =
        project.investmentRequired >= offer.amountMin &&
        project.investmentRequired <= offer.amountMax;
      const regionOk =
        offer.regions.length === 0 ||
        offer.regions.some((region) =>
          project.region.toLowerCase().includes(region.toLowerCase()),
        );
      return categoryOk && amountOk && regionOk;
    })
    .slice(0, limit);
}
