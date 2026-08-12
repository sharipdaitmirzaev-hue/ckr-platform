/**
 * Stage 4G — CKR Inbox unit tests (in-memory / migration contracts).
 * Run: npx tsx scripts/test-ckr-inbox-stage4g.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  intentDraftFromRequestType,
  isCkrRequestStatus,
  partnershipTypeToCkrRequestType,
  CKR_REQUEST_STATUSES,
} from "../src/config/ckr-inbox";
import { buildLiaBriefDraft } from "../src/lib/ckr-inbox/mappers";

const MIG = resolve(
  "supabase/migrations/20260812180000_ckr_inbox_stage4g.sql",
);

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(e instanceof Error ? e.stack : e);
  }
}

function sql() {
  return readFileSync(MIG, "utf8");
}

async function main() {
  console.log("\nStage 4G — CKR Inbox\n");

  await test("migration creates ckr_requests + RLS", () => {
    const s = sql();
    assert.match(s, /create table if not exists public\.ckr_requests/i);
    assert.match(s, /ckr_request_comments/i);
    assert.match(s, /ckr_request_events/i);
    assert.match(s, /enable row level security/i);
    assert.match(s, /visibility = 'CLIENT'/i);
    assert.match(s, /can_manage_ckr_inbox/i);
    assert.doesNotMatch(s, /disable row level security/i);
  });

  await test("internal privacy table is staff-only", () => {
    const privacy = readFileSync(
      resolve("supabase/migrations/20260812183000_ckr_inbox_internal_privacy.sql"),
      "utf8",
    );
    assert.match(privacy, /ckr_request_internal/i);
    assert.match(privacy, /can_manage_ckr_inbox/i);
    assert.match(privacy, /lia_brief = NULL/i);
  });

  await test("lifecycle statuses present", () => {
    for (const st of [
      "NEW",
      "IN_REVIEW",
      "IN_PROGRESS",
      "WAITING_CLIENT",
      "COMPLETED",
      "REJECTED",
    ]) {
      assert.equal(isCkrRequestStatus(st), true);
      assert.ok(CKR_REQUEST_STATUSES.includes(st as never));
    }
  });

  await test("partnership supplier → FIND_BUYER mapping", () => {
    assert.equal(partnershipTypeToCkrRequestType("supplier"), "FIND_BUYER");
    assert.equal(
      intentDraftFromRequestType("FIND_BUYER").intentType,
      "SEEK_BUYER",
    );
  });

  await test("LIA brief is CKR_ONLY draft without auto outreach", () => {
    const brief = buildLiaBriefDraft({
      organizationName: 'ООО "Тинда"',
      requestBody: "нужны покупатели напитков",
      region: "Дагестан",
      hasNeed: true,
      needTitle: "SEEK_BUYER",
    });
    assert.equal(brief.autoPublish, false);
    assert.ok(Array.isArray(brief.alreadyHave));
    assert.match(String(brief.recommendedNextStep), /Need Profile/i);
  });

  await test("internal vs client comment visibility contract", () => {
    const s = sql();
    assert.match(s, /ckr_comment_visibility/i);
    assert.match(s, /'INTERNAL'/);
    assert.match(s, /'CLIENT'/);
    // clients only see CLIENT comments via policy
    assert.match(
      s,
      /visibility = 'CLIENT'\s+AND public\.can_access_ckr_request/i,
    );
  });

  await test("idempotency index for double submit", () => {
    const s = sql();
    assert.match(s, /ckr_requests_idempotency_uidx/i);
    assert.match(s, /ensure_ckr_request_from_partnership/i);
    assert.match(s, /UNIQUE \(source_table, source_id\)/i);
  });

  await test("TINDA dry-run mapping from real partnership text", () => {
    const partnership = {
      id: "cfa172d8-944d-44cf-bb42-ea60ba41ad50",
      organization_id: "fb5843fb-ab25-43bc-9af7-d74c6ef66176",
      type: "supplier",
      description:
        "в случае если найдете мне клиентов для поставки напитков, буду оставлять цкр процент с продаж.",
      created_by: "0839fe5c-d5a0-4acd-946d-1f0f88ccd72b",
    };
    const mappedType = partnershipTypeToCkrRequestType(partnership.type);
    assert.equal(mappedType, "FIND_BUYER");
    const draft = intentDraftFromRequestType(mappedType);
    assert.equal(draft.intentType, "SEEK_BUYER");
    assert.match(partnership.description, /клиент/i);
  });

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
