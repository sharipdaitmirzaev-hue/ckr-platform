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
/**
 * Exact production IDs observed 2026-08-11 (Stage 4E deploy).
 * SAFE_TO_DELETE — only after separate owner confirm + dry-run backup.
 */
export const EXACT_SAFE_TO_DELETE_IDS = {
  needProfiles: [
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
    "d928a04d-c52b-4694-9033-be41bb41cd5c",
    "201c64e3-f27b-4b5b-baf9-17dc0dccbb5e",
    "e8421635-1366-4e6d-be62-573b4d21a8a1",
    "7f3a1d14-1b62-4d90-9af3-f3a42eeea743",
    "f170b27f-9a65-4e05-b83e-253da376c0c3",
    "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
    "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4",
  ],
  /** Stage4C diagnostic needs — KEEP until feed regression replaced */
  needProfilesKeepForFeedDiag: [
    "a1111111-1111-4111-8111-111111111111",
    "a2222222-2222-4222-8222-222222222222",
  ],
  marketplaceArchivedSmoke: ["7cb7ac9a-4bc7-4eaf-8201-f46082af571f"],
  oiStubSupportDemo: [
    "cand_3599d1245e8b446d",
    "cand_28c6b5148b03447d",
  ],
} as const;

export const KNOWN_TEST_DATA_INVENTORY: TestDataInventoryItem[] = [
  {
    id: "stage4a_smoke_needs",
    category: "need_profile",
    description: "Stage 4A smoke Need Profiles",
    label: "TEST",
    cleanupClass: "SAFE_TO_DELETE",
    exactIdsHint: [...EXACT_SAFE_TO_DELETE_IDS.needProfiles],
    notes: "Exact IDs from prod 2026-08-11. Удалять только после owner confirm.",
  },
  {
    id: "stage4b_smoke_needs",
    category: "need_profile",
    description: "Stage 4B personalized feed smoke needs",
    label: "TEST",
    cleanupClass: "SAFE_TO_DELETE",
    exactIdsHint: [
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4",
    ],
    notes: "Feed smoke fixtures.",
  },
  {
    id: "stage4c_diag_needs",
    category: "need_profile",
    description: "Stage 4C SEEK_SUPPORT/CONTRACT Dagestan diagnostic needs",
    label: "TEST",
    cleanupClass: "KEEP_FOR_AUDIT",
    exactIdsHint: [...EXACT_SAFE_TO_DELETE_IDS.needProfilesKeepForFeedDiag],
    notes: "Используются для feed A/B regression — не удалять до замены.",
  },
  {
    id: "stage4c_disposable_oi",
    category: "lia_oi_candidate",
    description: "Stage 4C disposable / smoke OI candidates",
    label: "TEST",
    cleanupClass: "SAFE_TO_DELETE",
    exactIdsHint: ["cand_smoke", "oi_smoke"],
    notes: "Не трогать audit events без необходимости.",
  },
  {
    id: "stub_oi",
    category: "lia_oi_candidate",
    description: "Stub / demo OI seed cards (isStub=true)",
    label: "SEED",
    cleanupClass: "KEEP_FOR_AUDIT",
    exactIdsHint: [...EXACT_SAFE_TO_DELETE_IDS.oiStubSupportDemo, "isStub=true"],
    notes: "В т.ч. MSP-GRANT/CREDIT demo с 4E live (не публиковать).",
  },
  {
    id: "fake_public_smoke_demand",
    category: "marketplace",
    description: "Fake/public smoke demand listings",
    label: "DEMO",
    cleanupClass: "UNCERTAIN",
    exactIdsHint: ["smoke-public-u1"],
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
    exactIdsHint: [...EXACT_SAFE_TO_DELETE_IDS.marketplaceArchivedSmoke],
    notes: "archived smoke target; не pattern-delete.",
  },
  {
    id: "real_oi_production",
    category: "lia_oi_candidate",
    description: "Real discovered OI from Serper/enrich (Stage 4D+)",
    label: "REAL",
    cleanupClass: "REAL_DATA",
    exactIdsHint: ["cand_5cf36ffd93e14102", "5cedf341-970a-49c3-9a35-14425b47a86c"],
    notes: "4E published Kontur food tender + other live discoveries.",
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
