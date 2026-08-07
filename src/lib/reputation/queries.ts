import {
  mapEntityHistoryRow,
  mapReputationProfileRow,
  mapReviewRow,
  mapTrustBadgeRow,
} from "@/lib/reputation/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  EntityHistoryItem,
  ReputationEntityType,
  ReputationProfile,
  Review,
  ReviewTargetType,
  TrustBadgeAward,
} from "@/types";
import type {
  EntityHistoryRow,
  ReputationProfileRow,
  ReviewRow,
  TrustBadgeRow,
} from "@/types/database";

export async function getReputationProfile(
  entityType: ReputationEntityType,
  entityId: string,
): Promise<ReputationProfile | null> {
  if (!hasSupabaseEnv() || !entityId) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("reputation_profiles")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .maybeSingle();
    if (error || !data) return null;
    return mapReputationProfileRow(data as ReputationProfileRow);
  } catch {
    return null;
  }
}

export async function listReviewsForTarget(
  targetType: ReviewTargetType,
  targetId: string,
  limit = 20,
): Promise<Review[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*, profiles:author_id(full_name)")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => {
      const review = row as ReviewRow & {
        profiles?: { full_name: string } | null;
      };
      return mapReviewRow(review, {
        authorName: review.profiles?.full_name,
      });
    });
  } catch {
    return [];
  }
}

/** Отзывы, где target_id = userId (как investor/expert/service) + проекты пользователя. */
export async function listReviewsAboutUser(
  userId: string,
  limit = 20,
): Promise<Review[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data: projects } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_id", userId)
      .limit(50);
    const projectIds = (projects ?? []).map((item) => item.id);

    const { data, error } = await supabase
      .from("reviews")
      .select("*, profiles:author_id(full_name)")
      .or(
        [
          `and(target_type.eq.investor,target_id.eq.${userId})`,
          `and(target_type.eq.expert,target_id.eq.${userId})`,
          `and(target_type.eq.service,target_id.eq.${userId})`,
          projectIds.length
            ? `and(target_type.eq.project,target_id.in.(${projectIds.join(",")}))`
            : null,
        ]
          .filter(Boolean)
          .join(","),
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      // fallback: simple by target_id
      const { data: fallback } = await supabase
        .from("reviews")
        .select("*, profiles:author_id(full_name)")
        .eq("target_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      return (fallback ?? []).map((row) => {
        const review = row as ReviewRow & {
          profiles?: { full_name: string } | null;
        };
        return mapReviewRow(review, {
          authorName: review.profiles?.full_name,
        });
      });
    }

    return data.map((row) => {
      const review = row as ReviewRow & {
        profiles?: { full_name: string } | null;
      };
      return mapReviewRow(review, {
        authorName: review.profiles?.full_name,
      });
    });
  } catch {
    return [];
  }
}

export async function listEntityHistory(
  entityType: ReputationEntityType,
  entityId: string,
  limit = 30,
): Promise<EntityHistoryItem[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("entity_history")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as EntityHistoryRow[]).map(mapEntityHistoryRow);
  } catch {
    return [];
  }
}

export async function listTrustBadges(
  entityType: ReputationEntityType,
  entityId: string,
): Promise<TrustBadgeAward[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trust_badges")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return (data as TrustBadgeRow[]).map(mapTrustBadgeRow);
  } catch {
    return [];
  }
}

export type ReputationBundle = {
  profile: ReputationProfile;
  reviews: Review[];
  history: EntityHistoryItem[];
  badges: TrustBadgeAward[];
};

export async function getUserReputationBundle(
  userId: string,
): Promise<ReputationBundle | null> {
  const { ensureReputationProfile } = await import(
    "@/lib/reputation/ensure-profile"
  );
  const profile = await ensureReputationProfile("user", userId);
  if (!profile) return null;

  const [reviews, history, badges] = await Promise.all([
    listReviewsAboutUser(userId),
    listEntityHistory("user", userId),
    listTrustBadges("user", userId),
  ]);

  return { profile, reviews, history, badges };
}
