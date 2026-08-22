/**
 * Stage 4O — server-only internal catalog loader (Supabase).
 * Do not import from Client Components.
 */

import {
  searchInternalCatalog,
  type InternalSearchOptions,
} from "@/lib/opportunity-discovery/internal";
import type {
  DiscoveryCandidate,
  InternalCatalogRow,
  OpportunitySearchContext,
} from "@/lib/opportunity-discovery/types";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Live load of internal entities (server-only). */
export async function loadInternalCatalogFromDb(
  limitPerType = 40,
): Promise<InternalCatalogRow[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const rows: InternalCatalogRow[] = [];

  const [orgs, needs, projects, opps, invs, experts] = await Promise.all([
    supabase
      .from("organizations")
      .select(
        "id, name, description, region, city, industry, products_services, offers_summary, seeks_summary, inn, ogrn, website, is_listed",
      )
      .eq("is_listed", true)
      .limit(limitPerType),
    supabase
      .from("need_profiles")
      .select(
        "id, title, description, intent_type, regions, industries, keywords, visibility, status, budget_max",
      )
      .eq("visibility", "PUBLIC")
      .eq("status", "ACTIVE")
      .limit(limitPerType),
    supabase
      .from("projects")
      .select(
        "id, title, summary, description, region, category, investment_required, status",
      )
      .eq("status", "published")
      .limit(limitPerType),
    supabase
      .from("opportunities")
      .select(
        "id, title, description, type, region, city, price, deadline_at, status, source_type, source_id",
      )
      .eq("status", "published")
      .limit(limitPerType),
    supabase
      .from("investment_offers")
      .select(
        "id, title, description, regions, categories, amount_min, amount_max, status, investment_type",
      )
      .eq("status", "published")
      .limit(limitPerType),
    supabase
      .from("expert_profiles")
      .select(
        "id, headline, description, specialization, region, status, services",
      )
      .eq("status", "published")
      .limit(limitPerType),
  ]);

  for (const o of orgs.data ?? []) {
    const productBits = [
      o.products_services,
      o.offers_summary,
      o.seeks_summary,
      o.industry,
    ]
      .map((x) => String(x || "").trim())
      .filter(Boolean);
    rows.push({
      entityType: "organization",
      id: String(o.id),
      title: String(o.name),
      summary: (o.description as string) || productBits.join(" · "),
      region: (o.region as string) || (o.city as string) || null,
      industry: (o.industry as string) || null,
      organization: String(o.name),
      url: (o.website as string) || null,
      href: `/admin/owner/companies`,
      inn: (o.inn as string) || null,
      ogrn: (o.ogrn as string) || null,
      keywords: productBits,
      status: "published",
    });
  }

  for (const n of needs.data ?? []) {
    rows.push({
      entityType: "need_profile",
      id: String(n.id),
      title: String(n.title),
      summary: (n.description as string) || "",
      region: Array.isArray(n.regions) ? String(n.regions[0] || "") : null,
      industry: Array.isArray(n.industries)
        ? String(n.industries[0] || "")
        : null,
      amount: n.budget_max != null ? Number(n.budget_max) : null,
      href: `/dashboard/needs`,
      keywords: [
        ...(Array.isArray(n.keywords) ? n.keywords.map(String) : []),
        String(n.intent_type || ""),
      ],
      sourceType: String(n.intent_type || ""),
      status: "published",
    });
  }

  for (const p of projects.data ?? []) {
    rows.push({
      entityType: "project",
      id: String(p.id),
      title: String(p.title),
      summary: (p.summary as string) || (p.description as string) || "",
      region: (p.region as string) || null,
      industry: (p.category as string) || null,
      amount:
        p.investment_required != null ? Number(p.investment_required) : null,
      href: `/project/${p.id}`,
      sourceType: "project",
      status: String(p.status || "published"),
    });
  }

  for (const o of opps.data ?? []) {
    rows.push({
      entityType: "opportunity",
      id: String(o.id),
      title: String(o.title),
      summary: (o.description as string) || "",
      region: (o.region as string) || (o.city as string) || null,
      amount: o.price != null ? Number(o.price) : null,
      deadline: (o.deadline_at as string) || null,
      url: null,
      href: `/opportunity/${o.id}`,
      sourceType: String(o.type || o.source_type || ""),
      noticeId: o.source_id ? String(o.source_id) : null,
      fingerprint: o.source_id ? String(o.source_id) : null,
      status: String(o.status || "published"),
    });
  }

  for (const i of invs.data ?? []) {
    rows.push({
      entityType: "investment_offer",
      id: String(i.id),
      title: String(i.title),
      summary: (i.description as string) || "",
      region: Array.isArray(i.regions) ? String(i.regions[0] || "") : null,
      industry: Array.isArray(i.categories)
        ? String(i.categories[0] || "")
        : null,
      amount: i.amount_max != null ? Number(i.amount_max) : null,
      href: `/investment/${i.id}`,
      keywords: [
        String(i.investment_type || ""),
        ...(Array.isArray(i.categories) ? i.categories.map(String) : []),
      ],
      sourceType: String(i.investment_type || "capital"),
      status: String(i.status || "published"),
    });
  }

  for (const e of experts.data ?? []) {
    rows.push({
      entityType: "expert_profile",
      id: String(e.id),
      title: String(e.headline || e.specialization || "Эксперт"),
      summary: (e.description as string) || (e.services as string) || "",
      region: (e.region as string) || null,
      industry: (e.specialization as string) || null,
      href: `/expert/${e.id}`,
      sourceType: "expert",
      status: String(e.status || "published"),
    });
  }

  return rows;
}

export async function runInternalSearch(
  ctx: OpportunitySearchContext,
  opts?: InternalSearchOptions,
): Promise<{ candidates: DiscoveryCandidate[]; sourcesQueried: number }> {
  const catalog = opts?.catalog ?? (await loadInternalCatalogFromDb());
  const candidates = searchInternalCatalog(ctx, {
    ...opts,
    catalog,
  });
  return { candidates, sourcesQueried: 7 };
}
