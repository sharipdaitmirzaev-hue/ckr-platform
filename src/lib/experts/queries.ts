import { getDemoExpertById, getDemoExperts } from "@/lib/demo/catalog";
import { isDemoCatalogFallbackEnabled } from "@/lib/demo/mode";
import { mapExpertProfileRow } from "@/lib/experts/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ExpertProfile, ExpertSpecialization, VerificationStatus } from "@/types";
import type { ExpertProfileRow } from "@/types/database";

export type ExpertWithUser = ExpertProfile & {
  fullName: string | null;
  companyName: string | null;
  verificationStatus: VerificationStatus;
};

export async function listPublishedExperts(filters?: {
  specialization?: ExpertSpecialization | null;
  region?: string | null;
}): Promise<ExpertWithUser[]> {
  const fromDemo = () =>
    getDemoExperts().filter((expert) => {
      if (
        filters?.specialization &&
        expert.specialization !== filters.specialization
      ) {
        return false;
      }
      if (
        filters?.region &&
        !expert.region.toLowerCase().includes(filters.region.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

  if (!hasSupabaseEnv()) {
    return isDemoCatalogFallbackEnabled() ? fromDemo() : [];
  }

  const supabase = createClient();
  let query = supabase
    .from("expert_profiles")
    .select(
      "*, profiles:user_id ( full_name, company_name, verification_status )",
    )
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (filters?.specialization) {
    query = query.eq("specialization", filters.specialization);
  }
  if (filters?.region) {
    query = query.ilike("region", `%${filters.region}%`);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    return isDemoCatalogFallbackEnabled() ? fromDemo() : [];
  }

  return data.map((row) => {
    const expert = mapExpertProfileRow(row as ExpertProfileRow);
    const profiles = row.profiles as {
      full_name: string | null;
      company_name: string | null;
      verification_status: VerificationStatus | null;
    } | null;
    return {
      ...expert,
      fullName: profiles?.full_name ?? null,
      companyName: profiles?.company_name ?? null,
      verificationStatus:
        expert.verificationStatus ??
        profiles?.verification_status ??
        "unverified",
    };
  });
}

export async function getExpertById(id: string): Promise<ExpertWithUser | null> {
  if (!hasSupabaseEnv()) {
    return isDemoCatalogFallbackEnabled() ? getDemoExpertById(id) : null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("expert_profiles")
    .select(
      "*, profiles:user_id ( full_name, company_name, verification_status )",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return isDemoCatalogFallbackEnabled() ? getDemoExpertById(id) : null;
  }

  const expert = mapExpertProfileRow(data as ExpertProfileRow);
  const profiles = data.profiles as {
    full_name: string | null;
    company_name: string | null;
    verification_status: VerificationStatus | null;
  } | null;

  return {
    ...expert,
    fullName: profiles?.full_name ?? null,
    companyName: profiles?.company_name ?? null,
    verificationStatus:
      expert.verificationStatus ??
      profiles?.verification_status ??
      "unverified",
  };
}

export async function getMyExpertProfile(
  userId: string,
): Promise<ExpertProfile | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("expert_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapExpertProfileRow(data as ExpertProfileRow);
}

export async function listExpertsForProjectRegion(
  region: string,
  limit = 4,
): Promise<ExpertWithUser[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("expert_profiles")
    .select(
      "*, profiles:user_id ( full_name, company_name, verification_status )",
    )
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(12);

  if (error || !data) return [];

  const regionLower = region.toLowerCase();

  return data
    .map((row) => {
      const expert = mapExpertProfileRow(row as ExpertProfileRow);
      const profiles = row.profiles as {
        full_name: string | null;
        company_name: string | null;
        verification_status: VerificationStatus | null;
      } | null;
      return {
        ...expert,
        fullName: profiles?.full_name ?? null,
        companyName: profiles?.company_name ?? null,
        verificationStatus:
          expert.verificationStatus ??
          profiles?.verification_status ??
          "unverified",
      };
    })
    .filter((expert) =>
      expert.region.toLowerCase().includes(regionLower) ||
      regionLower.includes(expert.region.toLowerCase()),
    )
    .slice(0, limit);
}
