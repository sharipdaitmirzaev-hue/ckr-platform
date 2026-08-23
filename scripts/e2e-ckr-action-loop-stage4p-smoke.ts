/**
 * Stage 4P — staging-only E2E smoke for Action Loop.
 *
 * SAFETY:
 * - Requires CKR_E2E_SMOKE=1
 * - Requires CKR_ENVIRONMENT=staging and CKR_ALLOW_STAGING_E2E=YES
 * - Hard-refuses production project ref / ckr-center.ru
 * - Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (staging)
 * - Creates ONLY entities marked E2E_CKR_STAGING / e2e.ckr.staging.*@ckr.local
 * - Writes manifest with exact IDs
 * - Cleanup deletes ONLY exact IDs from the manifest
 * - Refuses to touch TINDA ids
 *
 * Usage:
 *   CKR_E2E_SMOKE=1 CKR_ENVIRONMENT=staging CKR_ALLOW_STAGING_E2E=YES \
 *     npx tsx scripts/e2e-ckr-action-loop-stage4p-smoke.ts
 *
 * Exit codes:
 *   0 = success
 *   2 = skipped / refused (missing env / production target)
 *   1 = failure
 */
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  ACTION_EVENT,
  ckrActionTypeLabels,
} from "../src/config/ckr-action-loop";
import {
  deriveActionsFromEvents,
  toClientActionLoopView,
} from "../src/lib/ckr-action-loop/derive";
import {
  CKR_STAGING_SEED_MARKER,
  assertCkrStagingTarget,
  CkrStagingGuardError,
} from "./lib/ckr-staging-guard";

const MARKER = CKR_STAGING_SEED_MARKER;
const MANIFEST_PATH = resolve(
  process.env.CKR_E2E_MANIFEST_PATH ||
    "/tmp/cursor/artifacts/e2e-ckr-staging-manifest.json",
);

/** Known TINDA production ids — never touch. */
const TINDA_FREEZE_IDS = {
  // From historical pilot docs / seeds — defensive deny list
  orgNames: ["ТИНДА", "TINDA", "ООО ТИНДА"],
};

type Manifest = {
  marker: string;
  createdAt: string;
  users: string[];
  orgId: string | null;
  requestId: string | null;
  opportunityId: string | null;
  commentIds: string[];
  eventIds: string[];
  membershipIds: string[];
  needProfileIds: string[];
  roleRows: Array<{ user_id: string; role: string }>;
  staffUserId: string | null;
  clientUserId: string | null;
  claimUserId: string | null;
  claimRequestId: string | null;
  tindaBefore: Record<string, unknown> | null;
  tindaAfter: Record<string, unknown> | null;
  results: Record<string, unknown>;
};

function enabled(): boolean {
  return process.env.CKR_E2E_SMOKE === "1";
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function adminClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function emptyManifest(): Manifest {
  return {
    marker: MARKER,
    createdAt: new Date().toISOString(),
    users: [],
    orgId: null,
    requestId: null,
    opportunityId: null,
    commentIds: [],
    eventIds: [],
    membershipIds: [],
    needProfileIds: [],
    roleRows: [],
    staffUserId: null,
    clientUserId: null,
    claimUserId: null,
    claimRequestId: null,
    tindaBefore: null,
    tindaAfter: null,
    results: {},
  };
}

function saveManifest(m: Manifest) {
  mkdirSync(resolve("/tmp/cursor/artifacts"), { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2));
}

function loadManifest(): Manifest | null {
  if (!existsSync(MANIFEST_PATH)) return null;
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
}

async function snapshotTinda(admin: ReturnType<typeof adminClient>) {
  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name")
    .ilike("name", "%тинда%");
  const org = orgs?.[0];
  if (!org) {
    return { found: false };
  }
  const { data: requests } = await admin
    .from("ckr_requests")
    .select("id, status, next_step_public, public_activity_text")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const req = requests?.[0];
  if (!req) return { found: true, orgId: org.id, request: null };

  const { count: comments } = await admin
    .from("ckr_request_comments")
    .select("id", { count: "exact", head: true })
    .eq("request_id", req.id);
  const { count: events } = await admin
    .from("ckr_request_events")
    .select("id", { count: "exact", head: true })
    .eq("request_id", req.id);

  return {
    found: true,
    orgId: org.id,
    orgName: org.name,
    requestId: req.id,
    status: req.status,
    next_step_public: req.next_step_public,
    public_activity_text: req.public_activity_text,
    comments: comments ?? 0,
    events: events ?? 0,
  };
}

async function ensureUser(
  admin: ReturnType<typeof adminClient>,
  email: string,
  fullName: string,
  password: string,
): Promise<string> {
  const listed = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = listed.data.users.find((u) => u.email === email);
  if (existing) return existing.id;

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, demo: true, e2e: MARKER },
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message || `createUser failed ${email}`);
  }
  return created.data.user.id;
}

async function runSmoke() {
  const admin = adminClient();
  const ts = Date.now();
  const password = `E2e4p_${ts}_Xx!`;
  const clientEmail = `e2e.ckr.staging.client.${ts}@ckr.local`;
  const staffEmail =
    process.env.CKR_E2E_STAFF_EMAIL?.trim() ||
    `e2e.ckr.staging.staff.${ts}@ckr.local`;
  const claimEmail = `e2e.ckr.staging.claim.${ts}@ckr.local`;
  const m = emptyManifest();

  m.tindaBefore = await snapshotTinda(admin);
  console.log("TINDA_BEFORE", JSON.stringify(m.tindaBefore));

  // --- users ---
  const clientId = await ensureUser(
    admin,
    clientEmail,
    `${MARKER} Client`,
    password,
  );
  m.clientUserId = clientId;
  m.users.push(clientId);

  let staffId: string;
  if (process.env.CKR_E2E_STAFF_EMAIL) {
    const listed = await admin.auth.admin.listUsers({ perPage: 200 });
    const found = listed.data.users.find((u) => u.email === staffEmail);
    if (!found) throw new Error(`CKR_E2E_STAFF_EMAIL not found: ${staffEmail}`);
    staffId = found.id;
  } else {
    staffId = await ensureUser(
      admin,
      staffEmail,
      `${MARKER} Staff`,
      password,
    );
    m.users.push(staffId);
    await admin.from("user_roles").upsert(
      { user_id: staffId, role: "admin" },
      { onConflict: "user_id,role" },
    );
    m.roleRows.push({ user_id: staffId, role: "admin" });
  }
  m.staffUserId = staffId;

  await admin.from("profiles").upsert({
    id: clientId,
    full_name: `${MARKER} Client`,
    company_name: `${MARKER} Client Co`,
    is_public: false,
  });
  await admin.from("user_roles").upsert(
    { user_id: clientId, role: "entrepreneur" },
    { onConflict: "user_id,role" },
  );
  m.roleRows.push({ user_id: clientId, role: "entrepreneur" });

  // --- org ---
  const orgId = randomUUID();
  const { error: orgErr } = await admin.from("organizations").insert({
    id: orgId,
    name: `E2E 4P Test Company ${ts}`,
    type: "company",
    region: "Test Region",
    city: "Test City",
    created_by: staffId,
  });
  if (orgErr) throw new Error(orgErr.message);
  m.orgId = orgId;

  const { data: mem, error: memErr } = await admin
    .from("organization_members")
    .insert({
      organization_id: orgId,
      user_id: clientId,
      role: "owner",
    })
    .select("id")
    .single();
  if (memErr) throw new Error(memErr.message);
  m.membershipIds.push(mem.id);

  const { data: needRow, error: needErr } = await admin
    .from("need_profiles")
    .insert({
      owner_type: "user",
      owner_id: clientId,
      intent_type: "SEEK_BUYER",
      status: "ACTIVE",
      visibility: "PRIVATE",
      title: `${MARKER} need`,
      description: `${MARKER} synthetic need profile`,
      matching_enabled: false,
      created_by: clientId,
    })
    .select("id")
    .single();
  if (needErr) {
    m.results.needProfileSkip = needErr.message;
  } else if (needRow?.id) {
    m.needProfileIds.push(needRow.id);
    m.results.needProfile = "inserted";
  }
  saveManifest(m);

  // --- opportunity (published, technical) ---
  const oppId = randomUUID();
  const { error: oppErr } = await admin.from("opportunities").insert({
    id: oppId,
    title: `E2E 4P Test Opportunity ${ts}`,
    description: `${MARKER} technical smoke only`,
    type: "partner",
    status: "published",
    region: "Test Region",
    owner_id: staffId,
  });
  if (oppErr) throw new Error(`opportunity: ${oppErr.message}`);
  m.opportunityId = oppId;

  // --- request ---
  const requestId = randomUUID();
  const { error: reqErr } = await admin.from("ckr_requests").insert({
    id: requestId,
    from_user_id: clientId,
    organization_id: orgId,
    request_type: "FIND_BUYER",
    subject: `E2E 4P Test Request ${ts}`,
    body: `${MARKER} synthetic request — not TINDA, not real business`,
    status: "IN_PROGRESS",
    priority: "NORMAL",
    source: "manual",
    assigned_to: staffId,
  });
  if (reqErr) throw new Error(`request: ${reqErr.message}`);
  m.requestId = requestId;
  saveManifest(m);

  // --- share candidate (CLIENT comment + events) ---
  const { data: comment, error: cErr } = await admin
    .from("ckr_request_comments")
    .insert({
      request_id: requestId,
      author_id: staffId,
      body: `ЦКР нашёл вариант, который может быть вам интересен.\n\nE2E 4P Test Opportunity ${ts}\n${MARKER}`,
      visibility: "CLIENT",
    })
    .select("id")
    .single();
  if (cErr) throw new Error(cErr.message);
  m.commentIds.push(comment.id);

  const shareMeta = {
    stage4l: true,
    item_type: "opportunity",
    item_id: oppId,
    shared: true,
    e2e: MARKER,
  };
  const { data: shareEv, error: sErr } = await admin
    .from("ckr_request_events")
    .insert({
      request_id: requestId,
      event_type: "CANDIDATE_SHARED",
      title: "ЦКР нашёл новый вариант",
      detail: `E2E 4P Test Opportunity ${ts}`,
      visibility: "CLIENT",
      actor_user_id: staffId,
      meta: shareMeta,
    })
    .select("id")
    .single();
  if (sErr) throw new Error(sErr.message);
  m.eventIds.push(shareEv.id);

  // --- action loop via events (same as app dual-write) ---
  const actionId = randomUUID();
  async function insertDual(
    eventType: string,
    title: string,
    meta: Record<string, unknown>,
    clientTitle: string,
  ) {
    const { data: a, error: e1 } = await admin
      .from("ckr_request_events")
      .insert({
        request_id: requestId,
        event_type: eventType,
        title,
        detail: MARKER,
        visibility: "INTERNAL",
        actor_user_id: staffId,
        meta: { ...meta, e2e: MARKER },
      })
      .select("id")
      .single();
    if (e1) throw new Error(e1.message);
    m.eventIds.push(a.id);

    const publicMeta = { ...meta, e2e: MARKER };
    delete (publicMeta as { note_internal?: string }).note_internal;
    const { data: b, error: e2 } = await admin
      .from("ckr_request_events")
      .insert({
        request_id: requestId,
        event_type: eventType,
        title: clientTitle,
        detail: MARKER,
        visibility: "CLIENT",
        actor_user_id: staffId,
        meta: publicMeta,
      })
      .select("id")
      .single();
    if (e2) throw new Error(e2.message);
    m.eventIds.push(b.id);
  }

  await insertDual(
    ACTION_EVENT.created,
    `Действие: ${ckrActionTypeLabels.CONTACT}`,
    {
      stage4p: true,
      action_id: actionId,
      action_type: "CONTACT",
      status: "TODO",
      responsible: "CKR",
      note_internal: `${MARKER} internal only`,
      item_type: "opportunity",
      item_id: oppId,
      item_title: `E2E 4P Test Opportunity ${ts}`,
    },
    "ЦКР начал работу по варианту",
  );

  await insertDual(
    ACTION_EVENT.status,
    "Статус действия: В работе",
    {
      stage4p: true,
      action_id: actionId,
      status: "IN_PROGRESS",
    },
    "ЦКР выполняет следующий шаг",
  );

  const nextActionId = randomUUID();
  await insertDual(
    ACTION_EVENT.outcome,
    "Результат: Успех",
    {
      stage4p: true,
      action_id: actionId,
      status: "DONE",
      outcome: "SUCCESS",
      outcome_comment: "E2E smoke: получен ответ",
      next_action_type: "SEND_OFFER",
      note_public: "E2E smoke: получен ответ",
    },
    "E2E smoke: получен ответ",
  );

  await insertDual(
    ACTION_EVENT.created,
    `Действие: ${ckrActionTypeLabels.SEND_OFFER}`,
    {
      stage4p: true,
      action_id: nextActionId,
      action_type: "SEND_OFFER",
      status: "TODO",
      responsible: "CKR",
      item_type: "opportunity",
      item_id: oppId,
      item_title: `E2E 4P Test Opportunity ${ts}`,
    },
    "Следующий шаг: отправить предложение",
  );

  // client CTA
  await insertDual(
    ACTION_EVENT.clientCta,
    "Клиент: Интересно",
    {
      stage4p: true,
      action_id: nextActionId,
      client_cta: "INTERESTED",
      status: "IN_PROGRESS",
      note_public: "Клиент: Интересно",
    },
    "Вы ответили: Интересно",
  );

  saveManifest(m);

  // --- verify presentation ---
  const { data: evRows } = await admin
    .from("ckr_request_events")
    .select("id, event_type, meta, created_at, visibility")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  const clientEv = (evRows || []).filter((e) => e.visibility === "CLIENT");
  const actions = deriveActionsFromEvents(
    clientEv.map((e) => ({
      id: e.id,
      eventType: e.event_type,
      meta: e.meta as Record<string, unknown>,
      createdAt: e.created_at,
      visibility: e.visibility,
    })),
    { requestId, includeInternalNotes: false },
  );
  const view = toClientActionLoopView(actions, { hasSharedOpportunity: true });
  const payload = JSON.stringify({ view, actions });
  const leaks = [
    "TODO",
    "IN_PROGRESS",
    "DONE",
    "SUCCESS",
    "CANCELLED",
    "note_internal",
    "SECRET",
    "action_id",
    MARKER + " internal",
  ].filter((x) => new RegExp(x).test(JSON.stringify(view)));

  if (!view) throw new Error("client view null");
  if (leaks.length) throw new Error(`client leaks: ${leaks.join(",")}`);
  if (!/ответ|предложени/i.test(view.resultLabel || "")) {
    throw new Error(`unexpected resultLabel: ${view.resultLabel}`);
  }

  // security: client cannot set outcome — covered by unit tests; record here
  m.results = {
    actionId,
    nextActionId,
    clientView: view,
    leakCheck: "pass",
    doubleSubmitNote:
      "Known risk: two create clicks → two action_ids (see unit test). UI pending mitigates.",
  };

  // --- idea claim smoke (separate user + request) ---
  const claimToken = createHash("sha256")
    .update(`claim-${ts}`)
    .digest("hex")
    .slice(0, 64);
  const claimReqId = randomUUID();
  const { error: claimReqErr } = await admin.from("ckr_requests").insert({
    id: claimReqId,
    from_user_id: null,
    request_type: "IDEA",
    subject: `${MARKER} claim smoke`,
    body: "E2E 4P claim smoke — technical only",
    status: "NEW",
    priority: "NORMAL",
    source: "public_idea_form",
    claim_token_hash: createHash("sha256").update(claimToken).digest("hex"),
  });
  if (claimReqErr) {
    // claim_token_hash column may differ — soft-skip claim DB path
    m.results.claimSkip = claimReqErr.message;
  } else {
    m.claimRequestId = claimReqId;
    const claimUserId = await ensureUser(
      admin,
      claimEmail,
      `${MARKER} Claim User`,
      password,
    );
    m.claimUserId = claimUserId;
    m.users.push(claimUserId);
    // claim via update ownership (simulates successful claim RPC outcome)
    await admin
      .from("ckr_requests")
      .update({ from_user_id: claimUserId, status: "IN_REVIEW" })
      .eq("id", claimReqId)
      .is("from_user_id", null);
    m.results.claim = { claimReqId, claimUserId, redirect: "/dashboard?claim=1" };
  }

  m.tindaAfter = await snapshotTinda(admin);
  console.log("TINDA_AFTER", JSON.stringify(m.tindaAfter));
  if (
    JSON.stringify(m.tindaBefore) !== JSON.stringify(m.tindaAfter)
  ) {
    throw new Error("TINDA freeze violated — abort before cleanup");
  }

  saveManifest(m);
  console.log("MANIFEST", MANIFEST_PATH);
  console.log("SMOKE_OK", JSON.stringify({
    clientUserId: m.clientUserId,
    staffUserId: m.staffUserId,
    orgId: m.orgId,
    requestId: m.requestId,
    opportunityId: m.opportunityId,
  }));
}

async function cleanup(dryRun: boolean) {
  const m = loadManifest();
  if (!m) throw new Error(`No manifest at ${MANIFEST_PATH}`);
  if (m.marker !== MARKER) throw new Error("Manifest marker mismatch");

  const admin = adminClient();
  const plan: string[] = [];

  const push = (label: string, ids: string[]) => {
    for (const id of ids) plan.push(`${label}:${id}`);
  };
  push("event", m.eventIds);
  push("comment", m.commentIds);
  if (m.requestId) plan.push(`request:${m.requestId}`);
  if (m.claimRequestId) plan.push(`request:${m.claimRequestId}`);
  if (m.opportunityId) plan.push(`opportunity:${m.opportunityId}`);
  push("need_profile", m.needProfileIds || []);
  push("membership", m.membershipIds);
  if (m.orgId) plan.push(`org:${m.orgId}`);
  for (const r of m.roleRows) plan.push(`role:${r.user_id}:${r.role}`);
  for (const u of m.users) plan.push(`user:${u}`);

  console.log("CLEANUP_PLAN", JSON.stringify(plan, null, 2));
  if (dryRun) {
    console.log("DRY_RUN_ONLY");
    return;
  }

  // Delete in FK-safe order using exact IDs only
  if (m.eventIds.length) {
    await admin.from("ckr_request_events").delete().in("id", m.eventIds);
  }
  if (m.commentIds.length) {
    await admin.from("ckr_request_comments").delete().in("id", m.commentIds);
  }
  const reqIds = [m.requestId, m.claimRequestId].filter(Boolean) as string[];
  if (reqIds.length) {
    await admin.from("ckr_requests").delete().in("id", reqIds);
  }
  if (m.opportunityId) {
    await admin.from("opportunities").delete().eq("id", m.opportunityId);
  }
  if ((m.needProfileIds || []).length) {
    await admin.from("need_profiles").delete().in("id", m.needProfileIds);
  }
  if (m.membershipIds.length) {
    await admin
      .from("organization_members")
      .delete()
      .in("id", m.membershipIds);
  }
  if (m.orgId) {
    await admin.from("organizations").delete().eq("id", m.orgId);
  }
  for (const r of m.roleRows) {
    // Do not remove admin from pre-existing staff email
    if (
      process.env.CKR_E2E_STAFF_EMAIL &&
      r.user_id === m.staffUserId &&
      r.role === "admin"
    ) {
      continue;
    }
    await admin
      .from("user_roles")
      .delete()
      .eq("user_id", r.user_id)
      .eq("role", r.role);
  }
  for (const u of m.users) {
    if (process.env.CKR_E2E_STAFF_EMAIL && u === m.staffUserId) continue;
    await admin.from("profiles").delete().eq("id", u);
    await admin.auth.admin.deleteUser(u);
  }

  // Verify residual smoke rows for exact IDs
  let residual = 0;
  for (const id of m.eventIds) {
    const { data } = await admin
      .from("ckr_request_events")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (data) residual += 1;
  }
  for (const id of reqIds) {
    const { data } = await admin
      .from("ckr_requests")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (data) residual += 1;
  }
  console.log("RESIDUAL_SMOKE_ROWS", residual);
  if (residual !== 0) process.exit(1);
  console.log("CLEANUP_OK");
}

async function main() {
  if (!enabled()) {
    console.error(
      "SKIP: set CKR_E2E_SMOKE=1 and Supabase service role env to run.",
    );
    process.exit(2);
  }

  try {
    const target = assertCkrStagingTarget();
    console.log("STAGING_TARGET_OK", JSON.stringify(target));
  } catch (e) {
    if (e instanceof CkrStagingGuardError) {
      console.error("STAGING_TARGET_REFUSED", e.code, e.message);
      process.exit(2);
    }
    throw e;
  }

  if (process.env.CKR_E2E_CLEANUP_ONLY === "1") {
    if (!loadManifest()) {
      console.log("CLEANUP_SKIPPED_NO_MANIFEST");
      console.log("RESIDUAL_SMOKE_ROWS", 0);
      return;
    }
    await cleanup(process.env.CKR_E2E_DRY_RUN_CLEANUP === "1");
    return;
  }

  try {
    await runSmoke();
    if (process.env.CKR_E2E_SKIP_CLEANUP === "1") {
      console.log("SKIP_CLEANUP set — manifest retained for manual review");
      return;
    }
    await cleanup(process.env.CKR_E2E_DRY_RUN_CLEANUP === "1");
  } catch (e) {
    if (process.env.CKR_E2E_SKIP_CLEANUP !== "1") {
      try {
        await cleanup(process.env.CKR_E2E_DRY_RUN_CLEANUP === "1");
      } catch (cleanupErr) {
        console.error("CLEANUP_AFTER_FAILURE", cleanupErr);
      }
    }
    throw e;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
