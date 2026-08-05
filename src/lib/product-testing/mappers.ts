import type {
  ProductTest,
  ProductTestChecklistItem,
  ProductTestKind,
  ProductTestStatus,
} from "@/types";
import type { ProductTestRow } from "@/types/database";

function parseChecklist(value: unknown): ProductTestChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      if (typeof row.id !== "string" || typeof row.label !== "string") {
        return null;
      }
      return {
        id: row.id,
        label: row.label,
        done: Boolean(row.done),
        note: typeof row.note === "string" ? row.note : undefined,
      };
    })
    .filter((item): item is ProductTestChecklistItem => Boolean(item));
}

export function mapProductTestRow(row: ProductTestRow): ProductTest {
  return {
    id: row.id,
    kind: row.kind as ProductTestKind,
    scenarioKey: row.scenario_key,
    title: row.title,
    description: row.description,
    status: row.status as ProductTestStatus,
    checklist: parseChecklist(row.checklist),
    resultNotes: row.result_notes,
    issues: row.issues,
    recommendations: row.recommendations,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
