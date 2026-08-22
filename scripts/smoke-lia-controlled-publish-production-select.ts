/**
 * Selective production smoke publish for Stage 4C.
 * Publishes a curated ID list only — no mass publish.
 */
import {
  assertNoInternalLeak,
  enforceSafeProjection,
  getControlledPublishService,
  projectLiaOiToPublicDraft,
} from "../src/lib/lia/oi/publish";
import { getCandidate } from "../src/lib/lia/oi/store";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, getSupabaseSecretKey } from "../src/lib/supabase/env";

const ACTOR =
  process.env.CKR_SMOKE_ACTOR_ID || "0ae8067d-73e5-438e-bcfc-98e96d2c3001";

/** Curated max 5–8 real production OI ids */
const PLAN = {
  support: ["cand_97db9e740bf24f0d", "cand_0d563fafb04c48af"],
  procurement: ["cand_c7d0f0d6d8b44754", "cand_1da6f30e9eec4e3a"],
  auction: ["cand_ff2eb7d505ba46ed"],
  extra: ["cand_12909844a2b9444a"], // support credit programs
  reject: ["cand_df0b3668538a42ca"], // homepage-like procurement catalog
  expiry: ["cand_095443b43046478a"], // already "Завершено" in title
};

async function ensureNeedProfiles() {
  const { url } = getSupabaseEnv();
  const key = getSupabaseSecretKey()!;
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const ownerId = ACTOR;
  const rows = [
    {
      id: "np_smoke_seek_support_4c",
      owner_id: ownerId,
      owner_type: "user",
      intent_type: "SEEK_SUPPORT",
      title: "Stage4C smoke SEEK_SUPPORT manufacturing Dagestan",
      description: "Smoke need for controlled publish feed",
      status: "ACTIVE",
      regions: ["Дагестан"],
      industries: ["manufacturing"],
      visibility: "CKR_ONLY",
      source: "manual",
      created_by: ownerId,
    },
    {
      id: "np_smoke_seek_contract_4c",
      owner_id: ownerId,
      owner_type: "user",
      intent_type: "SEEK_CONTRACT",
      title: "Stage4C smoke SEEK_CONTRACT beverage Dagestan",
      description: "Smoke need for controlled publish feed",
      status: "ACTIVE",
      regions: ["Дагестан"],
      industries: ["beverage", "food"],
      visibility: "CKR_ONLY",
      source: "manual",
      created_by: ownerId,
    },
  ];
  for (const row of rows) {
    const { error } = await db.from("need_profiles").upsert(row, {
      onConflict: "id",
    });
    if (error) console.log("need_upsert_warn", row.id, error.message);
    else console.log("need_ok", row.id, row.intent_type);
  }
}

async function main() {
  const svc = getControlledPublishService();
  console.log("mode", svc.getMode());

  const publishIds = [
    ...PLAN.support,
    ...PLAN.procurement,
    ...PLAN.auction,
    ...PLAN.extra,
  ];

  for (const id of publishIds) {
    const c = await getCandidate(id);
    if (!c) {
      console.log("MISSING", id);
      continue;
    }
    const draft = projectLiaOiToPublicDraft(c);
    console.log("queue", id, draft.type, draft.title.slice(0, 60));
    await svc.queueOne(id, ACTOR);

    // owner region lock for Dagestan feed smoke + title lock on first support
    const overrides: Record<string, string> = {
      region: "Дагестан",
      city: "Махачкала",
    };
    if (id === PLAN.support[0]) {
      overrides.title = `${draft.title} (owner)`;
      overrides.description =
        (draft.description || "Господдержка").slice(0, 500) +
        "\n\nОтредактировано владельцем · Stage 4C smoke.";
    }
    if (id === PLAN.procurement[0]) {
      overrides.title = draft.title.includes("Закупка")
        ? draft.title
        : `Закупка: ${draft.title}`;
    }
    await svc.editDraft(id, ACTOR, overrides as never);

    const approved = await svc.approve(id, ACTOR);
    const leaks = assertNoInternalLeak({
      ...approved.projection,
      title: approved.opportunity.title,
      description: approved.opportunity.description,
      sourceLabel: approved.opportunity.sourceLabel,
    } as Record<string, unknown>);
    console.log(
      "published",
      id,
      "→",
      approved.opportunity.id,
      approved.opportunity.type,
      "price=",
      approved.opportunity.price ?? "UNKNOWN",
      "leaks=",
      leaks.length ? leaks.join(",") : "none",
    );
  }

  // reject smoke
  for (const id of PLAN.reject) {
    const c = await getCandidate(id);
    if (!c) continue;
    await svc.queueOne(id, ACTOR);
    await svc.reject(id, ACTOR, "smoke_reject_catalog_page");
    console.log("rejected", id);
  }

  // duplicate
  const dup = await svc.approve(PLAN.support[0]!, ACTOR);
  const existing = await svc.getPublishedBySourceAsync(PLAN.support[0]!);
  console.log("duplicate_same_id", existing?.id === dup.opportunity.id, dup.opportunity.id);
  console.log("owner_lock_title", existing?.title);

  // change review on procurement
  const procId = PLAN.procurement[0]!;
  const live = await getCandidate(procId);
  if (live) {
    const mutated = {
      ...live,
      nmck: (live.nmck && live.nmck > 0 ? live.nmck : 25_000_000) * 0.72,
    };
    const rev = await svc.onRediscovery(mutated);
    console.log("change_review", rev.action, rev.pending.map((p) => p.field));
    if (rev.action === "change_review") {
      await svc.rejectPendingChanges(procId, ACTOR);
      console.log("reject_changes_ok", procId);
    }
  }

  // expiry archive on completed auction (dedicated)
  const expId = PLAN.expiry[0]!;
  const exp = await getCandidate(expId);
  if (exp) {
    await svc.queueOne(expId, ACTOR);
    // force publish even if lifecycle unknown, then archive via rediscovery FACT
    try {
      await svc.approve(expId, ACTOR);
    } catch (e) {
      console.log("expiry_publish_skip", e instanceof Error ? e.message : e);
    }
    const closed = {
      ...exp,
      auctionStatus: "CANCELLED",
      procurementStage: "CANCELLED",
    };
    // ensure published state for archive path
    const pub = await svc.getPublishedBySourceAsync(expId);
    if (pub) {
      const arch = await svc.onRediscovery(closed);
      console.log("expiry_archive", expId, arch.action, pub.id);
    } else {
      console.log("expiry_no_public_row", expId);
    }
  }

  await ensureNeedProfiles();

  const published = await svc.listPublishedAsync();
  const byType: Record<string, number> = {};
  for (const p of published) byType[p.type] = (byType[p.type] || 0) + 1;
  console.log(
    "metrics",
    JSON.stringify(
      {
        published_active: published.filter((p) => p.status === "published").length,
        archived: published.filter((p) => p.status === "archived").length,
        byType,
        titles: published.map((p) => ({
          id: p.id,
          type: p.type,
          status: p.status,
          title: p.title.slice(0, 60),
          region: p.region,
          price: p.price,
          source: p.sourceLabel,
          sourceId: p.sourceId,
        })),
      },
      null,
      2,
    ),
  );

  // projection sample
  for (const p of published.filter((x) => x.status === "published").slice(0, 3)) {
    const safe = enforceSafeProjection({
      ...projectLiaOiToPublicDraft((await getCandidate(p.sourceId))!),
      title: p.title,
      description: p.description,
    });
    console.log("safe_keys", Object.keys(safe).sort().join(","));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
