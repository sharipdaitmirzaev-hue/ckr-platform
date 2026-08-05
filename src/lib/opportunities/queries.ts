import { CATALOG_LIST_LIMIT } from "@/config/catalog";
import {
  getDemoOpportunities,
  getDemoOpportunityById,
} from "@/lib/demo/catalog";
import { isDemoCatalogFallbackEnabled } from "@/lib/demo/mode";
import { mapOpportunityRow } from "@/lib/opportunities/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Opportunity } from "@/types";
import type { OpportunityCategoryRow, OpportunityRow } from "@/types/database";

export type OpportunityWithOwner = Opportunity & {
  ownerName: string | null;
  typeName: string | null;
};

async function typeNameMap(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from("opportunity_categories")
    .select("slug, name");
  const map = new Map<string, string>();
  (data ?? []).forEach((row) => {
    map.set(row.slug as string, row.name as string);
  });
  return map;
}

export async function listOpportunityCategories(): Promise<
  OpportunityCategoryRow[]
> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("opportunity_categories")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as OpportunityCategoryRow[];
}

export async function listPublishedOpportunities(): Promise<
  OpportunityWithOwner[]
> {
  if (!hasSupabaseEnv()) {
    return isDemoCatalogFallbackEnabled() ? getDemoOpportunities() : [];
  }

  const supabase = createClient();
  const types = await typeNameMap(supabase);

  const { data, error } = await supabase
    .from("opportunities")
    .select("*, profiles:owner_id ( full_name )")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(CATALOG_LIST_LIMIT);

  if (error || !data || data.length === 0) {
    return isDemoCatalogFallbackEnabled() ? getDemoOpportunities() : [];
  }

  return data.map((row) => {
    const opportunity = mapOpportunityRow(row as OpportunityRow);
    const profiles = row.profiles as { full_name: string | null } | null;
    return {
      ...opportunity,
      ownerName: profiles?.full_name ?? null,
      typeName: types.get(opportunity.type) ?? opportunity.type,
    };
  });
}

export async function listMyOpportunities(
  ownerId: string,
): Promise<Opportunity[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return (data as OpportunityRow[]).map(mapOpportunityRow);
}

export async function getOpportunityById(
  id: string,
): Promise<OpportunityWithOwner | null> {
  if (!hasSupabaseEnv()) {
    return isDemoCatalogFallbackEnabled() ? getDemoOpportunityById(id) : null;
  }

  const supabase = createClient();
  const types = await typeNameMap(supabase);

  const { data, error } = await supabase
    .from("opportunities")
    .select("*, profiles:owner_id ( full_name )")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return isDemoCatalogFallbackEnabled() ? getDemoOpportunityById(id) : null;
  }

  const opportunity = mapOpportunityRow(data as OpportunityRow);
  const profiles = data.profiles as { full_name: string | null } | null;

  return {
    ...opportunity,
    ownerName: profiles?.full_name ?? null,
    typeName: types.get(opportunity.type) ?? opportunity.type,
  };
}
