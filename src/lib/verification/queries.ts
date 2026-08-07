import { mapVerificationRequestRow } from "@/lib/verification/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  DocumentRelatedType,
  VerificationRequest,
  VerificationRequestStatus,
} from "@/types";
import type { VerificationRequestRow } from "@/types/database";

export type VerificationRequestListItem = VerificationRequest & {
  userName: string | null;
  targetTitle: string | null;
};

async function resolveTargetTitle(
  supabase: ReturnType<typeof createClient>,
  targetType: DocumentRelatedType,
  targetId: string,
): Promise<string | null> {
  if (targetType === "profile") {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", targetId)
      .maybeSingle();
    return data?.full_name ?? null;
  }

  if (targetType === "project") {
    const { data } = await supabase
      .from("projects")
      .select("title")
      .eq("id", targetId)
      .maybeSingle();
    return data?.title ?? null;
  }

  if (targetType === "opportunity") {
    const { data } = await supabase
      .from("opportunities")
      .select("title")
      .eq("id", targetId)
      .maybeSingle();
    return data?.title ?? null;
  }

  if (targetType === "investment") {
    const { data } = await supabase
      .from("investment_offers")
      .select("title")
      .eq("id", targetId)
      .maybeSingle();
    return data?.title ?? null;
  }

  if (targetType === "expert") {
    const { data } = await supabase
      .from("expert_profiles")
      .select("headline")
      .eq("id", targetId)
      .maybeSingle();
    return data?.headline ?? null;
  }

  return null;
}

export async function listMyVerificationRequests(
  userId: string,
): Promise<VerificationRequestListItem[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("verification_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const items: VerificationRequestListItem[] = [];
  for (const row of data) {
    const request = mapVerificationRequestRow(row as VerificationRequestRow);
    const targetTitle = await resolveTargetTitle(
      supabase,
      request.targetType,
      request.targetId,
    );
    items.push({
      ...request,
      userName: null,
      targetTitle,
    });
  }
  return items;
}

export async function listVerificationRequestsForAdmin(filters?: {
  status?: VerificationRequestStatus | null;
}): Promise<VerificationRequestListItem[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  let query = supabase
    .from("verification_requests")
    .select("*, profiles:user_id ( full_name )")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const items: VerificationRequestListItem[] = [];
  for (const row of data) {
    const request = mapVerificationRequestRow(row as VerificationRequestRow);
    const profiles = row.profiles as { full_name: string | null } | null;
    const targetTitle = await resolveTargetTitle(
      supabase,
      request.targetType,
      request.targetId,
    );
    items.push({
      ...request,
      userName: profiles?.full_name ?? null,
      targetTitle,
    });
  }
  return items;
}

export async function getPendingVerificationRequest(
  userId: string,
  targetType: DocumentRelatedType,
  targetId: string,
): Promise<VerificationRequest | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("verification_requests")
    .select("*")
    .eq("user_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "pending")
    .maybeSingle();

  if (error || !data) return null;
  return mapVerificationRequestRow(data as VerificationRequestRow);
}
