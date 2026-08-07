"use server";

import {
  PRODUCT_TEST_STATUSES,
  getScenario,
  type ProductTestStatus,
} from "@/config/product-testing";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import type { ProductTestChecklistItem } from "@/types";
import { revalidatePath } from "next/cache";

export type ProductTestActionState = {
  error?: string;
  success?: string;
};

function revalidateProductTests() {
  revalidatePath("/admin/product-tests");
  revalidatePath("/admin/dashboard");
}

function parseChecklistFromForm(
  formData: FormData,
  base: ProductTestChecklistItem[],
): ProductTestChecklistItem[] {
  return base.map((item) => ({
    ...item,
    done: formData.get(`check_${item.id}`) === "on",
    note: String(formData.get(`note_${item.id}`) ?? item.note ?? ""),
  }));
}

export async function startScenarioRunAction(
  scenarioKey: string,
): Promise<ProductTestActionState> {
  const admin = await requireAdmin();
  const scenario = getScenario(scenarioKey);
  if (!scenario) return { error: "Неизвестный сценарий." };

  const supabase = createClient();
  const checklist = scenario.checks.map((item) => ({
    id: item.id,
    label: item.label,
    done: false,
    note: "",
  }));

  const { error } = await supabase.from("product_tests").insert({
    kind: "scenario",
    scenario_key: scenario.key,
    title: scenario.title,
    description: `${scenario.summary}\n\nПоток: ${scenario.flow.join(" → ")}`,
    status: "in_progress",
    checklist,
    created_by: admin.user.id,
    updated_by: admin.user.id,
  });

  if (error) return { error: error.message };

  revalidateProductTests();
  return { success: `Прогон «${scenario.title}» создан.` };
}

export async function createProductTestTaskAction(
  _prev: ProductTestActionState,
  formData: FormData,
): Promise<ProductTestActionState> {
  const admin = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const scenarioKey = String(formData.get("scenarioKey") ?? "").trim() || null;

  if (title.length < 3) {
    return { error: "Укажите название задачи (не короче 3 символов)." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("product_tests").insert({
    kind: "task",
    scenario_key: scenarioKey,
    title,
    description,
    status: "pending",
    checklist: [],
    created_by: admin.user.id,
    updated_by: admin.user.id,
  });

  if (error) return { error: error.message };

  revalidateProductTests();
  return { success: "Тестовая задача создана." };
}

export async function updateProductTestAction(
  _prev: ProductTestActionState,
  formData: FormData,
): Promise<ProductTestActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Не указан тест." };

  const status = String(formData.get("status") ?? "") as ProductTestStatus;
  if (!PRODUCT_TEST_STATUSES.includes(status)) {
    return { error: "Некорректный статус." };
  }

  const supabase = createClient();
  const { data: existing, error: loadError } = await supabase
    .from("product_tests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !existing) {
    return { error: loadError?.message ?? "Тест не найден." };
  }

  const baseChecklist = Array.isArray(existing.checklist)
    ? (existing.checklist as ProductTestChecklistItem[]).map((item) => ({
        id: String(item.id),
        label: String(item.label),
        done: Boolean(item.done),
        note: item.note ? String(item.note) : "",
      }))
    : [];

  const checklist = parseChecklistFromForm(formData, baseChecklist);
  const completed =
    status === "passed" || status === "failed"
      ? new Date().toISOString()
      : null;

  const { error } = await supabase
    .from("product_tests")
    .update({
      status,
      checklist,
      result_notes: String(formData.get("resultNotes") ?? ""),
      issues: String(formData.get("issues") ?? ""),
      recommendations: String(formData.get("recommendations") ?? ""),
      updated_by: admin.user.id,
      completed_at: completed,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateProductTests();
  return { success: "Результат сохранён." };
}
