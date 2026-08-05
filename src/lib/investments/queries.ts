import {
  AMOUNT_FILTERS,
  type AmountFilterId,
} from "@/config/investments";
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
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  let query = supabase
    .from("investment_offers")
    .select("*, profiles:owner_id ( full_name )")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (filters.category) {
    query = query.contains("categories", [filters.category]);
  }

  const { data, error } = await query;
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
    .filter((offer) => overlapsAmount(offer, filters.amount));
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
  if (!hasSupabaseEnv()) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("investment_offers")
    .select("*, profiles:owner_id ( full_name )")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

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
