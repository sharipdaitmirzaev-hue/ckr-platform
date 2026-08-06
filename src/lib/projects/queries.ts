import { CATALOG_LIST_LIMIT } from "@/config/catalog";
import {
  getDemoProjectById,
  getDemoProjects,
} from "@/lib/demo/catalog";
import { isDemoCatalogFallbackEnabled } from "@/lib/demo/mode";
import { mapProjectRow } from "@/lib/projects/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/types";
import type { CategoryRow, ProjectRow } from "@/types/database";

export type ProjectWithOwner = Project & {
  ownerName: string | null;
  categoryName: string | null;
};

async function categoryNameMap(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase.from("categories").select("slug, name");
  const map = new Map<string, string>();
  (data ?? []).forEach((row) => {
    map.set(row.slug as string, row.name as string);
  });
  return map;
}

export async function listCategories(): Promise<CategoryRow[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as CategoryRow[];
}

export type ProjectCatalogFilters = {
  q?: string | null;
  category?: string | null;
  region?: string | null;
  stage?: string | null;
  status?: string | null;
};

function filterProjectsClient(
  items: ProjectWithOwner[],
  filters: ProjectCatalogFilters,
): ProjectWithOwner[] {
  const q = filters.q?.trim().toLowerCase() ?? "";
  return items.filter((project) => {
    if (filters.category && project.category !== filters.category) return false;
    if (
      filters.region &&
      !project.region.toLowerCase().includes(filters.region.toLowerCase())
    ) {
      return false;
    }
    if (filters.stage && project.stage !== filters.stage) return false;
    if (filters.status && project.status !== filters.status) return false;
    if (q) {
      const hay = `${project.title} ${project.summary} ${project.description} ${project.region}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export async function listPublishedProjects(
  filters: ProjectCatalogFilters = {},
): Promise<ProjectWithOwner[]> {
  const fromDemo = () =>
    filterProjectsClient(
      isDemoCatalogFallbackEnabled() ? getDemoProjects() : [],
      filters,
    );

  if (!hasSupabaseEnv()) {
    return fromDemo();
  }

  const supabase = createClient();
  const categories = await categoryNameMap(supabase);

  let query = supabase
    .from("projects")
    .select("*, profiles:owner_id ( full_name )")
    .in("status", ["published", "active", "completed"])
    .order("created_at", { ascending: false })
    .limit(CATALOG_LIST_LIMIT);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.region) query = query.ilike("region", `%${filters.region}%`);
  if (filters.stage) query = query.eq("stage", filters.stage);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    query = query.or(
      `title.ilike.%${q}%,summary.ilike.%${q}%,description.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return fromDemo();
  }

  const mapped = data.map((row) => {
    const project = mapProjectRow(row as ProjectRow);
    const profiles = row.profiles as { full_name: string | null } | null;
    return {
      ...project,
      ownerName: profiles?.full_name ?? null,
      categoryName: categories.get(project.category) ?? project.category,
    };
  });

  // Доп. клиентский фильтр для q по region и демо-совместимости
  return filterProjectsClient(mapped, { ...filters, category: null, stage: null, status: null, region: null });
}

export async function listMyProjects(ownerId: string): Promise<Project[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return (data as ProjectRow[]).map(mapProjectRow);
}

export async function getProjectById(
  id: string,
): Promise<ProjectWithOwner | null> {
  if (!hasSupabaseEnv()) {
    return isDemoCatalogFallbackEnabled() ? getDemoProjectById(id) : null;
  }

  const supabase = createClient();
  const categories = await categoryNameMap(supabase);

  const { data, error } = await supabase
    .from("projects")
    .select("*, profiles:owner_id ( full_name )")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return isDemoCatalogFallbackEnabled() ? getDemoProjectById(id) : null;
  }

  const project = mapProjectRow(data as ProjectRow);
  const profiles = data.profiles as { full_name: string | null } | null;

  return {
    ...project,
    ownerName: profiles?.full_name ?? null,
    categoryName: categories.get(project.category) ?? project.category,
  };
}
