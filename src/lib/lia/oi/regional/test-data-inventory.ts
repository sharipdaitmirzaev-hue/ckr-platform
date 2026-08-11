/**
 * Stage 4E — smoke/test data inventory (no deletes).
 * Labels: REAL | TEST | SEED | DEMO — documentation / diagnostics only.
 */

export type DataLabel = "REAL" | "TEST" | "SEED" | "DEMO";

export type CleanupClass =
  | "SAFE_TO_DELETE"
  | "KEEP_FOR_AUDIT"
  | "UNCERTAIN"
  | "REAL_DATA";

export type TestDataInventoryItem = {
  id: string;
  category: string;
  description: string;
  label: DataLabel;
  cleanupClass: CleanupClass;
  exactIdsHint: string[];
  notes: string;
};

/**
 * Known Stage 4A–4D / graph / stub pollution patterns.
 * Exact production IDs must be filled by dry-run script before any delete.
 */
export const KNOWN_TEST_DATA_INVENTORY: TestDataInventoryItem[] = [
  {
    id: "stage4a_smoke_needs",
    category: "need_profile",
    description: "Stage 4A smoke Need Profiles",
    label: "TEST",
    cleanupClass: "SAFE_TO_DELETE",
    exactIdsHint: ["np_smoke_", "smoke_need", "stage4a"],
    notes: "Удалять только по exact ID из dry-run.",
  },
  {
    id: "stage4b_smoke_needs",
    category: "need_profile",
    description: "Stage 4B personalized feed smoke needs",
    label: "TEST",
    cleanupClass: "SAFE_TO_DELETE",
    exactIdsHint: ["np_smoke_seek_", "smoke-support", "smoke-contract"],
    notes: "Feed smoke fixtures.",
  },
  {
    id: "stage4c_disposable_oi",
    category: "lia_oi_candidate",
    description: "Stage 4C disposable / smoke OI candidates",
    label: "TEST",
    cleanupClass: "SAFE_TO_DELETE",
    exactIdsHint: ["cand_smoke", "oi_smoke", "stub_"],
    notes: "Не трогать audit events без необходимости.",
  },
  {
    id: "stub_oi",
    category: "lia_oi_candidate",
    description: "Stub / demo OI seed cards (isStub=true)",
    label: "SEED",
    cleanupClass: "KEEP_FOR_AUDIT",
    exactIdsHint: ["isStub=true", "[STUB]"],
    notes: "Часть нужна для offline demos; классифицировать по ID.",
  },
  {
    id: "fake_public_smoke_demand",
    category: "marketplace",
    description: "Fake/public smoke demand listings",
    label: "DEMO",
    cleanupClass: "UNCERTAIN",
    exactIdsHint: ["smoke", "demo demand"],
    notes: "Проверить вручную — могут пересекаться с реальными.",
  },
  {
    id: "test_feedback",
    category: "lia_oi_feedback",
    description: "Test LIA OI feedback rows",
    label: "TEST",
    cleanupClass: "SAFE_TO_DELETE",
    exactIdsHint: ["feedback_smoke", "test_feedback"],
    notes: "Dry-run must list exact feedback IDs.",
  },
  {
    id: "test_lia_tasks",
    category: "lia_assignment",
    description: "Test LIA tasks / assignments",
    label: "TEST",
    cleanupClass: "SAFE_TO_DELETE",
    exactIdsHint: ["assign_smoke", "task_smoke"],
    notes: "Не удалять production owner assignments.",
  },
  {
    id: "graph_smoke",
    category: "business_graph",
    description: "Business Graph smoke edges/aliases (Stage 3A)",
    label: "TEST",
    cleanupClass: "KEEP_FOR_AUDIT",
    exactIdsHint: ["smoke-stage3a-production", "smoke-alias-"],
    notes: "KEEP until owner confirms; edges may be referenced.",
  },
  {
    id: "stage4c_published_smoke",
    category: "marketplace_opportunity",
    description: "Marketplace rows published during 4C smoke",
    label: "DEMO",
    cleanupClass: "UNCERTAIN",
    exactIdsHint: ["Stage 4C smoke", "Отредактировано владельцем"],
    notes: "Часть может быть помечена archived; не pattern-delete.",
  },
  {
    id: "real_oi_production",
    category: "lia_oi_candidate",
    description: "Real discovered OI from Serper/enrich (Stage 4D+)",
    label: "REAL",
    cleanupClass: "REAL_DATA",
    exactIdsHint: [],
    notes: "Никогда не включать в cleanup list без явного ID-исключения.",
  },
];

export function inventoryByCleanupClass(): Record<
  CleanupClass,
  TestDataInventoryItem[]
> {
  const out: Record<CleanupClass, TestDataInventoryItem[]> = {
    SAFE_TO_DELETE: [],
    KEEP_FOR_AUDIT: [],
    UNCERTAIN: [],
    REAL_DATA: [],
  };
  for (const item of KNOWN_TEST_DATA_INVENTORY) {
    out[item.cleanupClass].push(item);
  }
  return out;
}

export function summarizeInventory() {
  const by = inventoryByCleanupClass();
  return {
    total: KNOWN_TEST_DATA_INVENTORY.length,
    safeToDelete: by.SAFE_TO_DELETE.length,
    keepForAudit: by.KEEP_FOR_AUDIT.length,
    uncertain: by.UNCERTAIN.length,
    realData: by.REAL_DATA.length,
    labels: ["REAL", "TEST", "SEED", "DEMO"] as DataLabel[],
    migrationRequired: false,
  };
}
