import {
  interestTargetHref,
  interestTargetTypeLabels,
  type InvestorInterestTargetType,
} from "@/config/interests";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { InvestorInterest } from "@/types";
import type { InvestorInterestRow } from "@/types/database";

export type InterestListItem = InvestorInterest & {
  title: string;
  href: string;
  typeLabel: string;
};

async function resolveTitle(
  supabase: ReturnType<typeof createClient>,
  type: InvestorInterestTargetType,
  id: string,
): Promise<string> {
  if (type === "project") {
    const { data } = await supabase
      .from("projects")
      .select("title")
      .eq("id", id)
      .maybeSingle();
    return data?.title ?? "Проект";
  }
  if (type === "opportunity") {
    const { data } = await supabase
      .from("opportunities")
      .select("title")
      .eq("id", id)
      .maybeSingle();
    return data?.title ?? "Возможность";
  }
  const { data } = await supabase
    .from("investment_offers")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  return data?.title ?? "Инвестиции";
}

export async function listMyInterests(
  userId: string,
): Promise<InterestListItem[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("investor_interests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error || !data) return [];

    const items: InterestListItem[] = [];
    for (const row of data as InvestorInterestRow[]) {
      const targetType = row.target_type as InvestorInterestTargetType;
      const title = await resolveTitle(supabase, targetType, row.target_id);
      items.push({
        id: row.id,
        userId: row.user_id,
        targetType,
        targetId: row.target_id,
        createdAt: row.created_at,
        title,
        href: interestTargetHref(targetType, row.target_id),
        typeLabel: interestTargetTypeLabels[targetType],
      });
    }
    return items;
  } catch {
    return [];
  }
}

export async function hasInterest(
  userId: string,
  targetType: InvestorInterestTargetType,
  targetId: string,
): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("investor_interests")
      .select("id")
      .eq("user_id", userId)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function countMyInterests(userId: string): Promise<number> {
  if (!hasSupabaseEnv()) return 0;
  try {
    const supabase = createClient();
    const { count } = await supabase
      .from("investor_interests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    return count ?? 0;
  } catch {
    return 0;
  }
}
