import {
  PRODUCT_TEST_SCENARIOS,
  type ProductTestScenarioKey,
} from "@/config/product-testing";
import { mapProductTestRow } from "@/lib/product-testing/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ProductTest, ProductTestStatus } from "@/types";
import type { ProductTestRow } from "@/types/database";

export type ScenarioProgress = {
  key: ProductTestScenarioKey;
  title: string;
  summary: string;
  latest: ProductTest | null;
  status: ProductTestStatus;
};

export async function listProductTests(filters?: {
  kind?: "scenario" | "task" | null;
  status?: ProductTestStatus | null;
}): Promise<ProductTest[]> {
  if (!hasSupabaseEnv()) return [];

  try {
    const supabase = createClient();
    let query = supabase
      .from("product_tests")
      .select("*")
      .order("updated_at", { ascending: false });

    if (filters?.kind) query = query.eq("kind", filters.kind);
    if (filters?.status) query = query.eq("status", filters.status);

    const { data, error } = await query;
    if (error || !data) return [];
    return (data as ProductTestRow[]).map(mapProductTestRow);
  } catch {
    return [];
  }
}

export async function getProductTestById(
  id: string,
): Promise<ProductTest | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("product_tests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return mapProductTestRow(data as ProductTestRow);
  } catch {
    return null;
  }
}

export async function listScenarioProgress(): Promise<ScenarioProgress[]> {
  const runs = await listProductTests({ kind: "scenario" });

  return PRODUCT_TEST_SCENARIOS.map((scenario) => {
    const latest =
      runs.find((run) => run.scenarioKey === scenario.key) ?? null;
    return {
      key: scenario.key,
      title: scenario.title,
      summary: scenario.summary,
      latest,
      status: latest?.status ?? "pending",
    };
  });
}
