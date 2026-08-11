/**
 * Production/local smoke for Stage 4C Controlled Publish.
 * Selective queue+approve only — NO mass publish.
 *
 * Usage:
 *   npx tsx scripts/smoke-lia-controlled-publish-stage4c.ts --select
 *   npx tsx scripts/smoke-lia-controlled-publish-stage4c.ts --publish
 *   npx tsx scripts/smoke-lia-controlled-publish-stage4c.ts --verify
 */
import {
  assertNoInternalLeak,
  enforceSafeProjection,
  getControlledPublishService,
  passesPublicationQualityGate,
  projectLiaOiToPublicDraft,
} from "../src/lib/lia/oi/publish";
import { listCandidates, getCandidate } from "../src/lib/lia/oi/store";
import { createMemoryPersonalizedFeedService } from "../src/lib/personalized-feed/service";
import { getIntentMapping } from "../src/lib/personalized-feed/mapping";
import type { LiaOiCandidate } from "../src/types/lia-oi";
import type { NeedProfile } from "../src/types/need-profile";
import type { FeedCandidate } from "../src/types/personalized-feed";

const args = new Set(process.argv.slice(2));
const ACTOR = process.env.CKR_SMOKE_ACTOR_ID || "00000000-0000-4000-8000-000000000001";

function scoreCandidate(c: LiaOiCandidate): number {
  const dq = c.dataQualityScore ?? c.score?.quality ?? 0;
  const ready = c.matchingReadiness === "READY" ? 20 : c.matchingReadiness === "PARTIAL" ? 10 : 0;
  const official = c.isOfficialSource || c.dataChannel === "OFFICIAL_API" ? 15 : 0;
  const regionBonus = /дагестан|dagestan/i.test(c.region || "") ? 10 : 0;
  return Number(dq) + ready + official + regionBonus;
}

function pickSmoke(all: LiaOiCandidate[]) {
  const eligible = all.filter((c) => {
    const g = passesPublicationQualityGate(c);
    if (!g.ok) return false;
    const d = projectLiaOiToPublicDraft(c);
    return d.lifecycleHint === "active" || d.lifecycleHint === "unknown";
  });
  const by = (t: string) =>
    eligible
      .filter((c) => (c.opportunityType || "") === t)
      .sort((a, b) => scoreCandidate(b) - scoreCandidate(a));

  const support = by("SUPPORT_PROGRAM").slice(0, 2);
  const procurement = by("PROCUREMENT").slice(0, 2);
  const auction = by("AUCTION_ASSET").slice(0, 1);
  const other = eligible
    .filter(
      (c) =>
        !["SUPPORT_PROGRAM", "PROCUREMENT", "AUCTION_ASSET"].includes(
          c.opportunityType || "",
        ),
    )
    .sort((a, b) => scoreCandidate(b) - scoreCandidate(a))
    .slice(0, 2);

  return [...support, ...procurement, ...auction, ...other].slice(0, 8);
}

function need(
  partial: Partial<NeedProfile> & Pick<NeedProfile, "id" | "intentType" | "ownerId">,
): NeedProfile {
  return {
    title: partial.title || partial.intentType,
    description: "",
    ownerType: "user",
    status: "ACTIVE",
    budgetMin: null,
    budgetMax: null,
    currency: "RUB",
    regions: [],
    industries: [],
    keywords: [],
    criteria: {},
    visibility: "CKR_ONLY",
    priority: "NORMAL",
    timeHorizon: null,
    riskPreference: null,
    matchingEnabled: true,
    lastMatchedAt: null,
    contextGroupId: null,
    fingerprint: null,
    source: "manual",
    createdBy: partial.ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

async function main() {
  const all = await listCandidates();
  const picks = pickSmoke(all);
  console.log(`mode candidates=${all.length} smoke_picks=${picks.length}`);
  for (const c of picks) {
    const d = projectLiaOiToPublicDraft(c);
    console.log(
      `- ${c.id} [${c.opportunityType}] ${d.title.slice(0, 70)} | ${d.region} | ${d.price ?? "UNKNOWN"} | ${d.sourceLabel} | dq=${d.dataQualityScore}`,
    );
  }

  if (args.has("--select") && !args.has("--publish")) {
    console.log("SELECT_ONLY — no publish");
    return;
  }

  const svc = getControlledPublishService();
  console.log("publish_mode", svc.getMode());

  if (args.has("--publish")) {
    // reject one extra eligible as smoke reject (if available)
    const rejectCand = all.find(
      (c) =>
        passesPublicationQualityGate(c).ok &&
        !picks.some((p) => p.id === c.id) &&
        (c.opportunityType === "WEB_LISTING" || c.opportunityType === "OTHER"),
    );

    for (const c of picks) {
      const q = await svc.queueOne(c.id, ACTOR);
      console.log("queue", c.id, q);
      if (!q.queued && q.reason !== "already_published") continue;

      // owner edit lock on first support
      if (c.opportunityType === "SUPPORT_PROGRAM" && c === picks[0]) {
        await svc.editDraft(c.id, ACTOR, {
          title: `${projectLiaOiToPublicDraft(c).title} (owner)`,
          description:
            (c.summary || c.description || "Господдержка").slice(0, 200) +
            "\n\nОтредактировано владельцем для smoke Stage 4C.",
        });
      }

      const approved = await svc.approve(c.id, ACTOR);
      const proj = enforceSafeProjection(
        projectLiaOiToPublicDraft(await getCandidate(c.id) as LiaOiCandidate),
      );
      const leaks = assertNoInternalLeak({
        ...approved.projection,
        ...proj,
        title: approved.opportunity.title,
        description: approved.opportunity.description,
      } as Record<string, unknown>);
      console.log(
        "approve",
        c.id,
        "→",
        approved.opportunity.id,
        approved.opportunity.type,
        "leaks=",
        leaks.length ? leaks.join(",") : "none",
      );
    }

    if (rejectCand) {
      await svc.queueOne(rejectCand.id, ACTOR);
      await svc.reject(rejectCand.id, ACTOR, "smoke_reject_not_for_users");
      console.log("reject", rejectCand.id);
    }

    // duplicate approve
    if (picks[0]) {
      const again = await svc.approve(picks[0].id, ACTOR);
      const first = await svc.getPublishedBySourceAsync(picks[0].id);
      console.log(
        "duplicate_ok",
        first?.id === again.opportunity.id,
        again.opportunity.id,
      );
    }

    // change review on procurement if present
    const proc = picks.find((c) => c.opportunityType === "PROCUREMENT");
    if (proc) {
      const live = await getCandidate(proc.id);
      if (live) {
        const mutated = {
          ...live,
          nmck: (live.nmck || 10_000_000) * 0.72,
        };
        const rev = await svc.onRediscovery(mutated);
        console.log("change_review", proc.id, rev.action, rev.pending.map((p) => p.field));
        if (rev.action === "change_review") {
          await svc.rejectPendingChanges(proc.id, ACTOR);
          console.log("reject_changes", proc.id);
        }
      }
    }

    // expiry on a disposable published other/auction if we published >5 — prefer synthetic archive via rediscovery on a copy path
    // Use a dedicated low-value pick: last other/auction — simulate CANCELLED without destroying useful active if only one auction
    const expTarget = picks.find((c) => c.opportunityType === "AUCTION_ASSET") || picks[picks.length - 1];
    if (expTarget && picks.length >= 5) {
      const live = await getCandidate(expTarget.id);
      if (live) {
        const closed = {
          ...live,
          auctionStatus: "CANCELLED",
          procurementStage: "CANCELLED",
        };
        const arch = await svc.onRediscovery(closed);
        console.log("expiry_archive", expTarget.id, arch.action);
      }
    }
  }

  if (args.has("--verify") || args.has("--publish")) {
    const published = await svc.listPublishedAsync();
    const byType: Record<string, number> = {};
    for (const p of published) byType[p.type] = (byType[p.type] || 0) + 1;
    console.log("published_count", published.length, byType);

    // Feed memory check using published rows
    const feed = createMemoryPersonalizedFeedService();
    feed.resetForTests();
    const toCand = (o: (typeof published)[0]): FeedCandidate => ({
      id: o.id,
      itemType: "opportunity",
      title: o.title,
      summary: o.description,
      region: o.region,
      industry: o.type,
      industries: [o.type, o.region],
      price: o.price,
      priceKnown: o.price != null,
      currency: o.currency,
      status: o.status,
      sourceChannel: "external",
      sourceLabel: o.sourceLabel,
      sourceKey: "lia_published",
      href: `/opportunity/${o.id}`,
      fingerprint: o.fingerprint,
      canonicalUrl: o.canonicalUrl,
      deadlineAt: o.deadlineAt,
      dataQuality: Number(o.dataQualityScore || 6),
      sourceConfidence: 6,
      updatedAt: o.updatedAt,
      createdAt: o.createdAt,
      rawType: o.type,
      unknownFields: o.price == null ? ["price"] : [],
      confirmedFields: ["title", "region", "source"],
    });
    feed.setTestCandidates(published.filter((p) => p.status === "published").map(toCand));

    const supportNeed = need({
      id: "smoke-support",
      intentType: "SEEK_SUPPORT",
      ownerId: "smoke-user",
      regions: ["Дагестан"],
      industries: ["manufacturing"],
    });
    const contractNeed = need({
      id: "smoke-contract",
      intentType: "SEEK_CONTRACT",
      ownerId: "smoke-user",
      regions: ["Дагестан"],
      industries: ["beverage", "food"],
    });
    feed.setTestNeeds([supportNeed, contractNeed]);

    const s = await feed.getFeedForNeedProfile({ need: supportNeed, ownerId: "smoke-user" });
    const c = await feed.getFeedForNeedProfile({ need: contractNeed, ownerId: "smoke-user" });
    console.log("coverage", {
      support: getIntentMapping("SEEK_SUPPORT").coverage,
      contract: getIntentMapping("SEEK_CONTRACT").coverage,
    });
    console.log("feed_support", {
      candidates: s.diagnostics.candidateCount,
      recommended: s.diagnostics.recommendedCount,
      top: s.recommendations[0]?.candidate.title,
      why: s.recommendations[0]?.explanation.why,
      source: s.recommendations[0]?.candidate.sourceLabel,
    });
    console.log("feed_contract", {
      candidates: c.diagnostics.candidateCount,
      recommended: c.diagnostics.recommendedCount,
      top: c.recommendations[0]?.candidate.title,
      why: c.recommendations[0]?.explanation.why,
      source: c.recommendations[0]?.candidate.sourceLabel,
      deadline: c.recommendations[0]?.candidate.deadlineAt,
      price: c.recommendations[0]?.candidate.price,
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
