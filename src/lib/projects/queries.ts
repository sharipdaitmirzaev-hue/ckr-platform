import {
  getDemoProjectById,
  getDemoProjects,
} from "@/lib/demo/catalog";
import { useDemoCatalogFallback } from "@/lib/demo/mode";
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

export async function listPublishedProjects(): Promise<ProjectWithOwner[]> {
  if (!hasSupabaseEnv()) {
    return useDemoCatalogFallback() ? getDemoProjects() : [];
  }

  const supabase = createClient();
  const categories = await categoryNameMap(supabase);

  const { data, error } = await supabase
    .from("projects")
    .select("*, profiles:owner_id ( full_name )")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return useDemoCatalogFallback() ? getDemoProjects() : [];
  }

  return data.map((row) => {
    const project = mapProjectRow(row as ProjectRow);
    const profiles = row.profiles as { full_name: string | null } | null;
    return {
      ...project,
      ownerName: profiles?.full_name ?? null,
      categoryName: categories.get(project.category) ?? project.category,
    };
  });
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
    return useDemoCatalogFallback() ? getDemoProjectById(id) : null;
  }

  const supabase = createClient();
  const categories = await categoryNameMap(supabase);

  const { data, error } = await supabase
    .from("projects")
    .select("*, profiles:owner_id ( full_name )")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return useDemoCatalogFallback() ? getDemoProjectById(id) : null;
  }

  const project = mapProjectRow(data as ProjectRow);
  const profiles = data.profiles as { full_name: string | null } | null;

  return {
    ...project,
    ownerName: profiles?.full_name ?? null,
    categoryName: categories.get(project.category) ?? project.category,
  };
}
