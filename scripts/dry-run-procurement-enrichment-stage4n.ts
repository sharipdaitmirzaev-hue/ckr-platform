/**
 * Stage 4N — read-only / dry-run DETAIL resolver for known TINDA notices.
 * Does NOT write to production DB. Does NOT mutate TINDA.
 *
 * Usage: npx tsx scripts/dry-run-procurement-enrichment-stage4n.ts
 * Optional: CKR_4N_LIVE=1 to hit reachable secondary mirrors (safeFetch).
 */
import {
  productFitScore,
} from "../src/lib/demand-intelligence";
import {
  assessOfficialEisAccess,
  officialEisRequiresOwnerCredentialsMessage,
  resetProcurementDetailCache,
  resolveProcurementDetail,
  summarizeDetailResolveStats,
} from "../src/lib/lia/oi/procurement";

const NOTICES = [
  {
    id: "0303300064726000936",
    label: "anchor",
    mirrorUrls: [
      "https://star-pro.ru/region/respublika-dagestan/l0303300064726000936-1",
    ],
  },
  {
    id: "0103200008426006399",
    label: "детский дом / молочка",
    mirrorUrls: [
      "https://star-pro.ru/region/respublika-dagestan/l0103200008426006399-1",
    ],
  },
  {
    id: "0103200008426006801",
    label: "РЦИБ / продукты",
    mirrorUrls: [
      "https://star-pro.ru/region/respublika-dagestan/l0103200008426006801-1",
    ],
  },
  {
    id: "0103200008426006533",
    label: "лагерь Планета",
    mirrorUrls: [
      "https://star-pro.ru/region/respublika-dagestan/l0103200008426006533-1",
    ],
  },
  {
    id: "0303300143726000006",
    label: "чай",
    mirrorUrls: [
      "https://zakupki360.ru/tender/97804165",
      "https://star-pro.ru/region/respublika-dagestan/l0303300143726000006-1",
    ],
  },
] as const;

async function main() {
  const live = process.env.CKR_4N_LIVE === "1";
  console.log("=== Stage 4N dry-run DETAIL ===");
  console.log("liveFetch:", live);
  console.log("BEFORE DETAIL baseline: 0/8 (Stage 4M)");

  const access = assessOfficialEisAccess({
    publicHtmlProbe: {
      dnsOk: true,
      tcp443Ok: false,
      httpStatus: null,
      error: "tcp_timeout",
    },
  });
  console.log("\nEIS access:", {
    soapConfigured: access.soapConfigured,
    soapStatus: access.soapStatus,
    networkFailureClass: access.networkFailureClass,
    requiresOwnerCredentials: access.requiresOwnerCredentials,
  });
  if (access.requiresOwnerCredentials) {
    console.log("\n" + officialEisRequiresOwnerCredentialsMessage());
  }

  resetProcurementDetailCache();
  const results = [];

  for (const n of NOTICES) {
    const detail = await resolveProcurementDetail({
      noticeId: n.id,
      mirrorUrls: [...n.mirrorUrls],
      allowLiveFetch: live,
      skipCache: true,
    });
    const fit = productFitScore(
      ["food", "beverage"],
      ["напитки", "продукты", "чай", "вода"],
      `${detail.title || ""} ${detail.subject || ""}`,
    );
    results.push({ notice: n.id, label: n.label, detail, fit });
    console.log("\n---", n.id, `(${n.label})`);
    console.log("  confidence:", detail.confidence);
    console.log("  customer:", detail.customer || "UNKNOWN");
    console.log("  amount:", detail.amount ?? "UNKNOWN");
    console.log("  deadline:", detail.deadlineAt || "UNKNOWN");
    console.log("  lifecycle:", detail.lifecycle);
    console.log("  sources:", detail.sourcesUsed.join(", ") || "none");
    console.log(
      "  productFit:",
      fit.score,
      fit.matched.join(",") || "—",
    );
    console.log(
      "  attempts:",
      detail.attempts
        .slice(0, 6)
        .map((a) => `${a.sourceId}:${a.ok ? "ok" : a.reason}`)
        .join(" | "),
    );
  }

  const stats = summarizeDetailResolveStats(results.map((r) => r.detail));
  const rate =
    stats.detailAttempts === 0
      ? 0
      : Math.round((100 * stats.detailSuccess) / stats.detailAttempts);

  console.log("\n=== SUMMARY ===");
  console.log({
    uniqueNotices: results.length,
    detailAttempts: stats.detailAttempts,
    detailSuccess: stats.detailSuccess,
    detailFailure: stats.detailFailure,
    detailSuccessRate: `${stats.detailSuccess}/${stats.detailAttempts} (${rate}%)`,
    before: "0/8",
    officialConfirmed: stats.officialConfirmed,
    multiSourceConfirmed: stats.multiSourceConfirmed,
    secondaryOnly: stats.secondaryOnly,
    customers: results.filter((r) => r.detail.customer).length,
    amounts: results.filter((r) => r.detail.amount != null).length,
    deadlines: results.filter((r) => r.detail.deadlineAt).length,
    teaFit: results.find((r) => r.notice === "0303300143726000006")?.fit.score,
  });
  console.log("\nNo DB writes. Production untouched. STOP criteria apply.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
