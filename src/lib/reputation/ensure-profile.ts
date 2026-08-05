import { deriveVerificationLevel } from "@/config/reputation";
import { mapReputationProfileRow } from "@/lib/reputation/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ReputationEntityType, ReputationProfile } from "@/types";
import type { ReputationProfileRow } from "@/types/database";

/**
 * Гарантирует наличиепутационный профиль и обновляет агрегаты по фактам платформы.
 * Не выносит «вердикт» — только счётчики и средний рейтинг отзывов.
 */
export async function ensureReputationProfile(
  entityType: ReputationEntityType,
  entityId: string,
): Promise<ReputationProfile | null> {
  if (!hasSupabaseEnv() || !entityId) return null;

  try {
    const supabase = createClient();

    let platformVerified = false;
    let completedProjects = 0;
    let completedDeals = 0;

    if (entityType === "user") {
      const [{ data: profile }, projectsRes, dealsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("verification_status")
          .eq("id", entityId)
          .maybeSingle(),
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", entityId)
          .in("status", ["published", "active", "completed"]),
        supabase
          .from("deals")
          .select("id", { count: "exact", head: true })
          .or(`initiator_id.eq.${entityId},partner_id.eq.${entityId}`)
          .eq("status", "completed"),
      ]);
      platformVerified = profile?.verification_status === "verified";
      completedProjects = projectsRes.count ?? 0;
      completedDeals = dealsRes.count ?? 0;
    } else {
      const [{ data: org }, projectsRes] = await Promise.all([
        supabase
          .from("organizations")
          .select("verification_status")
          .eq("id", entityId)
          .maybeSingle(),
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", entityId)
          .in("status", ["published", "active", "completed"]),
      ]);
      platformVerified = org?.verification_status === "verified";
      completedProjects = projectsRes.count ?? 0;
    }

    const { data: reviewRows } = await supabase
      .from("reviews")
      .select("rating")
      .eq("target_id", entityId);

    const ratings = (reviewRows ?? []).map((row) => Number(row.rating));
    const reviewsCount = ratings.length;
    const score =
      reviewsCount > 0
        ? Math.round(
            (ratings.reduce((sum, value) => sum + value, 0) / reviewsCount) *
              100,
          ) / 100
        : 0;

    const verificationLevel = deriveVerificationLevel({
      platformVerified,
      completedDeals,
      completedProjects,
      score,
    });

    const payload = {
      entity_type: entityType,
      entity_id: entityId,
      score,
      verification_level: verificationLevel,
      completed_projects: completedProjects,
      completed_deals: completedDeals,
      reviews_count: reviewsCount,
    };

    const { data, error } = await supabase
      .from("reputation_profiles")
      .upsert(payload, { onConflict: "entity_type,entity_id" })
      .select("*")
      .maybeSingle();

    if (error || !data) {
      const { data: existing } = await supabase
        .from("reputation_profiles")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .maybeSingle();
      if (!existing) return null;
      return mapReputationProfileRow(existing as ReputationProfileRow);
    }

    // Авто-бейджи по фактам (идемпотентно)
    if (platformVerified) {
      await supabase.from("trust_badges").upsert(
        {
          entity_type: entityType,
          entity_id: entityId,
          badge: "verified",
        },
        { onConflict: "entity_type,entity_id,badge" },
      );
    }
    if (entityType === "user" && completedDeals >= 2) {
      await supabase.from("trust_badges").upsert(
        {
          entity_type: entityType,
          entity_id: entityId,
          badge: "experienced_investor",
        },
        { onConflict: "entity_type,entity_id,badge" },
      );
    }

    return mapReputationProfileRow(data as ReputationProfileRow);
  } catch {
    return null;
  }
}

export async function recordEntityHistory(input: {
  entityType: ReputationEntityType;
  entityId: string;
  kind: "project" | "deal" | "partnership" | "task";
  title: string;
  relatedType?: string | null;
  relatedId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  if (!hasSupabaseEnv()) return;
  try {
    const supabase = createClient();
    await supabase.from("entity_history").insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      kind: input.kind,
      title: input.title,
      related_type: input.relatedType ?? null,
      related_id: input.relatedId ?? null,
      meta: input.meta ?? {},
    });
  } catch {
    // история не должна ломать основной сценарий
  }
}
