"use server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { fingerprintFromCreate } from "@/lib/need-profile/fingerprint";
import { needProfileToNodeInput } from "@/lib/need-profile/graph-bridge";
import { needToRow, rowToNeed, type NeedProfileRow } from "@/lib/need-profile/mappers";
import { parseNeedProfileDrafts } from "@/lib/need-profile/nl-parser";
import { createClient } from "@/lib/supabase/server";
import { getBusinessGraphService } from "@/lib/business-graph/service";
import { resolveBusinessGraphStoreMode } from "@/lib/business-graph/mode";
import type {
  NeedIntentType,
  NeedOwnerType,
  NeedProfileDraft,
  NeedStatus,
  NeedVisibility,
} from "@/types/need-profile";
import { INTENT_LABELS } from "@/types/need-profile";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";

export type NeedActionState = {
  error?: string;
  success?: string;
  drafts?: NeedProfileDraft[];
  confirmationText?: string;
};

async function requireUser() {
  const current = await getCurrentUser();
  if (!current) throw new Error("auth_required");
  return current;
}

export async function createNeedProfileAction(
  _prev: NeedActionState,
  formData: FormData,
): Promise<NeedActionState> {
  try {
    const current = await requireUser();
    const supabase = createClient();
    const intentType = String(formData.get("intentType") || "") as NeedIntentType;
    const title =
      String(formData.get("title") || "").trim() ||
      INTENT_LABELS[intentType] ||
      intentType;
    const description = String(formData.get("description") || "").trim();
    const budgetMaxRaw = String(formData.get("budgetMax") || "").trim();
    const budgetMax = budgetMaxRaw ? Number(budgetMaxRaw) : null;
    const regions = String(formData.get("regions") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const industries = String(formData.get("industries") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const visibility = (String(formData.get("visibility") || "CKR_ONLY") ||
      "CKR_ONLY") as NeedVisibility;
    const status = (String(formData.get("status") || "ACTIVE") ||
      "ACTIVE") as NeedStatus;
    const ownerType = (String(formData.get("ownerType") || "user") ||
      "user") as NeedOwnerType;
    let ownerId =
      String(formData.get("ownerId") || "").trim() || current.user.id;

    if (!intentType) return { error: "Выберите тип потребности" };

    if (ownerType === "organization") {
      const { data: mem } = await supabase
        .from("organization_members")
        .select("id,role")
        .eq("organization_id", ownerId)
        .eq("user_id", current.user.id)
        .maybeSingle();
      if (!mem) {
        return { error: "Нет доступа к организации для Need Profile." };
      }
    } else {
      ownerId = current.user.id;
    }

    const input = {
      intentType,
      title,
      description,
      ownerType,
      ownerId,
      budgetMax,
      regions,
      industries,
      visibility,
      status,
      source: "manual" as const,
      createdBy: current.user.id,
    };
    const fingerprint = fingerprintFromCreate(input);

    const { data: existing } = await supabase
      .from("need_profiles")
      .select("*")
      .eq("fingerprint", fingerprint)
      .in("status", ["DRAFT", "ACTIVE", "PAUSED"])
      .maybeSingle();
    if (existing) {
      revalidatePath("/dashboard/needs");
      return { success: "Похожая потребность уже есть", };
    }

    const row = needToRow({
      id: randomUUID(),
      intentType,
      title,
      description,
      ownerType,
      ownerId,
      status,
      budgetMin: null,
      budgetMax,
      currency: "RUB",
      regions,
      industries,
      keywords: [],
      criteria: {},
      visibility,
      priority: "NORMAL",
      timeHorizon: null,
      riskPreference: null,
      matchingEnabled: true,
      lastMatchedAt: null,
      contextGroupId: null,
      fingerprint,
      source: "manual",
      createdBy: current.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { data, error } = await supabase
      .from("need_profiles")
      .insert(row)
      .select("*")
      .single();
    if (error) return { error: error.message };

    await supabase.from("need_profile_events").insert({
      need_profile_id: data.id,
      event_type: "CREATED",
      payload: { source: "manual" },
      actor_user_id: current.user.id,
    });

    if (ownerType === "organization") {
      await supabase.from("organization_events").insert({
        organization_id: ownerId,
        event_type: "need_created",
        title: `Need Profile · ${intentType}`,
        detail: title,
        visibility: "CKR_ONLY",
        actor_user_id: current.user.id,
        meta: { need_profile_id: data.id },
      });
    }

    // Optional graph bridge when store is supabase
    try {
      if (resolveBusinessGraphStoreMode() === "supabase") {
        const need = rowToNeed(data as NeedProfileRow);
        const g = getBusinessGraphService("supabase");
        const { node } = await g.createOrUpdateNode(needProfileToNodeInput(need));
        await supabase.from("need_profile_events").insert({
          need_profile_id: need.id,
          event_type: "GRAPH_BRIDGED",
          payload: { nodeId: node.id, noMatches: true },
          actor_user_id: current.user.id,
        });
      }
    } catch {
      // Graph optional until enabled
    }

    revalidatePath("/dashboard/needs");
    redirect(`/dashboard/needs/${data.id}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { error: e instanceof Error ? e.message : "Ошибка создания" };
  }
}

export async function parseNeedNlAction(
  _prev: NeedActionState,
  formData: FormData,
): Promise<NeedActionState> {
  const text = String(formData.get("text") || "").trim();
  if (!text) return { error: "Опишите потребность" };
  const parsed = parseNeedProfileDrafts(text);
  return {
    drafts: parsed.drafts,
    confirmationText: [
      "Я понял запрос так:",
      "",
      ...parsed.drafts.map((d, i) => {
        const budget =
          d.budgetMax != null
            ? `до ${(d.budgetMax / 1_000_000).toLocaleString("ru-RU")} млн ₽`
            : "не указан";
        return [
          `${i + 1}. ${INTENT_LABELS[d.intentType] || d.intentType}`,
          `Бюджет: ${budget}`,
          `Регион: ${d.regions.join(", ") || "не указан"}`,
          `Отрасль: ${d.industries.join(", ") || "не указана"}`,
          d.reasoningSummary,
        ].join("\n");
      }),
      "",
      "Подтвердите сохранение — без подтверждения ничего не записывается.",
    ].join("\n"),
    success: "Черновик готов к подтверждению",
  };
}

export async function confirmNeedDraftsAction(
  _prev: NeedActionState,
  formData: FormData,
): Promise<NeedActionState> {
  try {
    const current = await requireUser();
    const supabase = createClient();
    const raw = String(formData.get("draftsJson") || "");
    if (!raw) return { error: "Нет черновиков" };
    const drafts = JSON.parse(raw) as NeedProfileDraft[];
    if (!Array.isArray(drafts) || drafts.length === 0) {
      return { error: "Пустые черновики" };
    }
    const groupId = drafts.length > 1 ? randomUUID() : null;
    const ids: string[] = [];

    for (const d of drafts) {
      const input = {
        intentType: d.intentType,
        title: d.title,
        description: d.description,
        ownerType: "user" as const,
        ownerId: current.user.id,
        budgetMin: d.budgetMin ?? null,
        budgetMax: d.budgetMax ?? null,
        regions: d.regions,
        industries: d.industries,
        source: "lia_nl" as const,
        createdBy: current.user.id,
      };
      const fingerprint = fingerprintFromCreate(input);
      const { data: existing } = await supabase
        .from("need_profiles")
        .select("id")
        .eq("fingerprint", fingerprint)
        .in("status", ["DRAFT", "ACTIVE", "PAUSED"])
        .maybeSingle();
      if (existing) {
        ids.push(existing.id);
        continue;
      }
      const row = needToRow({
        id: randomUUID(),
        ...input,
        status: "ACTIVE",
        currency: "RUB",
        keywords: d.keywords || [],
        criteria: d.criteria || {},
        visibility: "CKR_ONLY",
        priority: "NORMAL",
        timeHorizon: null,
        riskPreference: null,
        matchingEnabled: true,
        lastMatchedAt: null,
        contextGroupId: groupId,
        fingerprint,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const { data, error } = await supabase
        .from("need_profiles")
        .insert(row)
        .select("id")
        .single();
      if (error) return { error: error.message };
      await supabase.from("need_profile_events").insert([
        {
          need_profile_id: data.id,
          event_type: "CREATED",
          payload: { source: "lia_nl" },
          actor_user_id: current.user.id,
        },
        {
          need_profile_id: data.id,
          event_type: "CONFIRMED_FROM_NL",
          payload: { confidence: d.confidence },
          actor_user_id: current.user.id,
        },
      ]);
      ids.push(data.id);
    }

    revalidatePath("/dashboard/needs");
    if (ids.length === 1) redirect(`/dashboard/needs/${ids[0]}`);
    redirect("/dashboard/needs");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { error: e instanceof Error ? e.message : "Ошибка подтверждения" };
  }
}

export async function setNeedStatusAction(
  _prev: NeedActionState,
  formData: FormData,
): Promise<NeedActionState> {
  try {
    const current = await requireUser();
    const supabase = createClient();
    const id = String(formData.get("id") || "");
    const status = String(formData.get("status") || "") as NeedStatus;
    if (!id || !status) return { error: "Некорректные данные" };

    const { error } = await supabase
      .from("need_profiles")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: error.message };

    await supabase.from("need_profile_events").insert({
      need_profile_id: id,
      event_type: status === "ARCHIVED" ? "ARCHIVED" : "STATUS_CHANGED",
      payload: { status },
      actor_user_id: current.user.id,
    });

    revalidatePath("/dashboard/needs");
    revalidatePath(`/dashboard/needs/${id}`);
    return { success: `Статус: ${status}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка" };
  }
}
