import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  OpportunityRow,
  ProjectRow,
} from "@/types/database";

/**
 * Снимок рынка для будущего анализа Лией.
 * Пока без автоматических выводов — только структурированные данные.
 */
export type LiaMarketSnapshot = {
  projectsTotal: number;
  projectsPublished: number;
  projectsByCategory: Record<string, number>;
  projectsByRegion: Record<string, number>;
  /** Спрос: заявки на проекты / возможности / инвестиции */
  demand: {
    applicationsTotal: number;
    applicationsToProjects: number;
    applicationsToOpportunities: number;
    applicationsToInvestments: number;
  };
  /** Предложения: возможности и инвестиционные офферы */
  supply: {
    opportunitiesPublished: number;
    investmentsPublished: number;
    opportunitiesByType: Record<string, number>;
  };
  generatedAt: string;
};

function tally(keys: Array<string | null | undefined>): Record<string, number> {
  const map: Record<string, number> = {};
  for (const key of keys) {
    const normalized = (key || "не указано").trim() || "не указано";
    map[normalized] = (map[normalized] ?? 0) + 1;
  }
  return map;
}

export async function getLiaMarketSnapshot(): Promise<LiaMarketSnapshot> {
  const empty: LiaMarketSnapshot = {
    projectsTotal: 0,
    projectsPublished: 0,
    projectsByCategory: {},
    projectsByRegion: {},
    demand: {
      applicationsTotal: 0,
      applicationsToProjects: 0,
      applicationsToOpportunities: 0,
      applicationsToInvestments: 0,
    },
    supply: {
      opportunitiesPublished: 0,
      investmentsPublished: 0,
      opportunitiesByType: {},
    },
    generatedAt: new Date().toISOString(),
  };

  if (!hasSupabaseEnv()) return empty;

  try {
    const supabase = createClient();
    const [
      projectsRes,
      opportunitiesRes,
      investmentsCount,
      appsTotal,
      appsProjects,
      appsOpps,
      appsInvest,
    ] = await Promise.all([
      supabase.from("projects").select("category, region, status"),
      supabase
        .from("opportunities")
        .select("type, status")
        .eq("status", "published"),
      supabase
        .from("investment_offers")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase.from("applications").select("id", { count: "exact", head: true }),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("target_type", "project"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("target_type", "opportunity"),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("target_type", "investment"),
    ]);

    const projects = (projectsRes.data ?? []) as Pick<
      ProjectRow,
      "category" | "region" | "status"
    >[];
    const opportunities = (opportunitiesRes.data ?? []) as Pick<
      OpportunityRow,
      "type" | "status"
    >[];

    return {
      projectsTotal: projects.length,
      projectsPublished: projects.filter((p) => p.status === "published").length,
      projectsByCategory: tally(projects.map((p) => p.category)),
      projectsByRegion: tally(projects.map((p) => p.region)),
      demand: {
        applicationsTotal: appsTotal.count ?? 0,
        applicationsToProjects: appsProjects.count ?? 0,
        applicationsToOpportunities: appsOpps.count ?? 0,
        applicationsToInvestments: appsInvest.count ?? 0,
      },
      supply: {
        opportunitiesPublished: opportunities.length,
        investmentsPublished: investmentsCount.count ?? 0,
        opportunitiesByType: tally(opportunities.map((o) => o.type)),
      },
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return empty;
  }
}

/**
 * Текстовый блок для промпта Лии (факты без выводов).
 */
export function formatLiaMarketSnapshot(snapshot: LiaMarketSnapshot): string {
  const topCategories = Object.entries(snapshot.projectsByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
  const topRegions = Object.entries(snapshot.projectsByRegion)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");

  return [
    "Данные рынка ЦКР (без выводов):",
    `Проекты: всего ${snapshot.projectsTotal}, опубликовано ${snapshot.projectsPublished}.`,
    topCategories ? `Категории проектов: ${topCategories}.` : null,
    topRegions ? `Регионы проектов: ${topRegions}.` : null,
    `Спрос (заявки): всего ${snapshot.demand.applicationsTotal} (проекты ${snapshot.demand.applicationsToProjects}, возможности ${snapshot.demand.applicationsToOpportunities}, инвестиции ${snapshot.demand.applicationsToInvestments}).`,
    `Предложения: возможности ${snapshot.supply.opportunitiesPublished}, инвестиции ${snapshot.supply.investmentsPublished}.`,
  ]
    .filter(Boolean)
    .join("\n");
}
