"use server";

import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import { findCompanyDuplicate } from "@/lib/company-intelligence/duplicates";
import { buildLiaCompanyEnrichmentDraft } from "@/lib/company-intelligence/lia-enrich-draft";
import { mapOrganizationRow } from "@/lib/partners/mappers";
import { createClient } from "@/lib/supabase/server";
import { getBusinessGraphService } from "@/lib/business-graph/service";
import { isOrganizationType } from "@/config/partners";
import type { OrganizationRow } from "@/types/database";
import { revalidatePath } from "next/cache";

export type OwnerCompanyActionState = {
  error?: string;
  success?: string;
  organizationId?: string;
};

function revalidateCompany(id?: string) {
  revalidatePath("/admin/owner/companies");
  revalidatePath("/admin/owner/regional");
  revalidatePath("/organizations");
  if (id) revalidatePath(`/organizations/${id}`);
}

/** Manual owner seed — no mass import, no fake data. */
export async function ownerSeedCompanyAction(
  _prev: OwnerCompanyActionState,
  formData: FormData,
): Promise<OwnerCompanyActionState> {
  const session = await requireLiaOiOwner();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "company");
  const region = String(formData.get("region") ?? "Дагестан").trim();
  const city = String(formData.get("city") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const legalName = String(formData.get("legalName") ?? "").trim();
  const inn = String(formData.get("inn") ?? "").replace(/\D/g, "");
  const ogrn = String(formData.get("ogrn") ?? "").replace(/\D/g, "");
  const offersSummary = String(formData.get("offersSummary") ?? "").trim();
  const seeksSummary = String(formData.get("seeksSummary") ?? "").trim();
  const productsServices = String(formData.get("productsServices") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  const sourceLabel = String(formData.get("sourceLabel") ?? "").trim();
  const markVerified = formData.get("markVerified") === "on";
  const bridgeGraph = formData.get("bridgeGraph") === "on";

  if (name.length < 2) return { error: "Укажите название." };
  if (!isOrganizationType(type)) return { error: "Некорректный тип." };
  if (!sourceUrl && !website) {
    return { error: "Нужен source URL или сайт (provenance)." };
  }
  if (inn && !(inn.length === 10 || inn.length === 12)) {
    return { error: "ИНН только 10/12 цифр или пусто (UNKNOWN)." };
  }

  const supabase = createClient();
  const { data: existingRows } = await supabase
    .from("organizations")
    .select("*")
    .limit(500);
  const existing = (existingRows as OrganizationRow[] | null)?.map(
    mapOrganizationRow,
  ) || [];
  const dup = findCompanyDuplicate(
    { id: "", name, inn, ogrn, website },
    existing,
  );
  if (dup.kind === "inn" || dup.kind === "ogrn") {
    return {
      error: `Дубликат по ${dup.kind}: уже есть ${dup.matchedId}`,
    };
  }

  const { data: orgId, error } = await supabase.rpc(
    "create_organization_with_owner",
    {
      p_name: name,
      p_type: type,
      p_description: description,
      p_website: website,
      p_region: region,
      p_city: city,
    },
  );

  if (error || !orgId) {
    return { error: error?.message || "Не удалось создать." };
  }

  const data = { id: orgId as string };

  const { error: enrichError } = await supabase
    .from("organizations")
    .update({
      industry,
      legal_name: legalName,
      inn,
      ogrn,
      offers_summary: offersSummary,
      seeks_summary: seeksSummary,
      products_services: productsServices,
      source_url: sourceUrl || website,
      source_label: sourceLabel || "owner_manual_seed",
      verification_status: markVerified ? "verified" : "unverified",
      is_listed: true,
    })
    .eq("id", data.id);
  if (enrichError) {
    return { error: enrichError.message };
  }

  await supabase.from("organization_events").insert({
    organization_id: data.id,
    event_type: "created",
    title: "Owner seed · Stage 4F",
    detail: sourceLabel || sourceUrl || website,
    visibility: "CKR_ONLY",
    actor_user_id: session.user.id,
  });

  if (bridgeGraph) {
    try {
      const graph = getBusinessGraphService();
      await graph.bridgeFromOrganization({
        id: data.id,
        name,
        description,
        region,
        city,
        website,
        inn,
        ogrn,
        industry,
        verificationStatus: markVerified ? "verified" : "unverified",
      });
    } catch {
      /* graph optional */
    }
  }

  revalidateCompany(data.id);
  return {
    success: "Компания добавлена (без auto-publish marketplace).",
    organizationId: data.id,
  };
}

export async function ownerLiaEnrichCompanyDraftAction(
  _prev: OwnerCompanyActionState,
  formData: FormData,
): Promise<OwnerCompanyActionState> {
  await requireLiaOiOwner();
  const orgId = String(formData.get("organizationId") ?? "").trim();
  if (!orgId) return { error: "organizationId required" };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .maybeSingle();
  if (error || !data) return { error: error?.message || "Не найдена" };

  const org = mapOrganizationRow(data as OrganizationRow);
  const draft = buildLiaCompanyEnrichmentDraft(org);

  const { error: upErr } = await supabase
    .from("organizations")
    .update({ lia_enrichment_draft: draft })
    .eq("id", orgId);
  if (upErr) return { error: upErr.message };

  await supabase.from("organization_events").insert({
    organization_id: orgId,
    event_type: "lia_enrichment_draft",
    title: "Черновик обогащения Лии",
    detail: `${draft.queries.length} queries · без автопубликации`,
    visibility: "OWNER_ONLY",
  });

  revalidateCompany(orgId);
  return {
    success: "Черновик Лии сохранён (DRAFT, autoPublish=false).",
    organizationId: orgId,
  };
}
