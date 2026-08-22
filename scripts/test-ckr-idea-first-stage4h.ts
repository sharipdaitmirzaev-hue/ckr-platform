/**
 * Stage 4H — Idea-first UX unit tests (migration contracts + security helpers).
 * Run: npx tsx scripts/test-ckr-idea-first-stage4h.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  isCkrRequestType,
  partnershipTypeToCkrRequestType,
} from "../src/config/ckr-inbox";
import {
  dashboardNavAdvanced,
  dashboardNavBasic,
} from "../src/config/navigation";
import {
  decodeClaimCookie,
  encodeClaimCookie,
  hashToken,
  sanitizeIdeaInput,
} from "../src/lib/idea-first/security";
import { resolveDashboardNav } from "../src/lib/cabinet/access";
import { buildLiaBriefDraft } from "../src/lib/ckr-inbox/mappers";

const MIG = resolve(
  "supabase/migrations/20260812190000_ckr_idea_first_stage4h.sql",
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
  console.log("\nStage 4H — Idea-first UX\n");

  await test("migration allows nullable from_user_id + IDEA type", () => {
    const s = sql();
    assert.match(s, /ALTER COLUMN from_user_id DROP NOT NULL/i);
    assert.match(s, /ADD VALUE IF NOT EXISTS 'IDEA'/i);
    assert.match(s, /public_idea_form/i);
    assert.match(s, /submit_public_idea/i);
    assert.match(s, /claim_ckr_request/i);
    assert.match(s, /ckr_public_submit_rate/i);
    assert.match(s, /ckr_access_level/i);
  });

  await test("RPC does not trust caller for status/priority/assigned", () => {
    const s = sql();
    assert.match(s, /request_type,\s*[\s\S]*'IDEA'/i);
    assert.match(s, /status,\s*[\s\S]*'NEW'/i);
    assert.match(s, /priority,\s*[\s\S]*'NORMAL'/i);
    assert.doesNotMatch(s, /p_assigned_to/);
    assert.doesNotMatch(s, /p_status/);
    assert.doesNotMatch(s, /p_priority/);
  });

  await test("IDEA type is registered in config", () => {
    assert.equal(isCkrRequestType("IDEA"), true);
  });

  await test("sanitize rejects short idea / too many urls", () => {
    const short = sanitizeIdeaInput({ name: "Али", idea: "коротко" });
    assert.equal(short.ok, false);
    const spam = sanitizeIdeaInput({
      name: "Али",
      idea:
        "Хочу производство воды в Дагестане. http://a.com http://b.com http://c.com http://d.com extra",
    });
    assert.equal(spam.ok, false);
    const ok = sanitizeIdeaInput({
      name: "Али",
      idea:
        "Хочу открыть небольшое производство воды в Дагестане. Есть 15 млн, нужен участок.",
    });
    assert.equal(ok.ok, true);
  });

  await test("claim cookie roundtrip + token hash", () => {
    const token = "abc123token";
    const enc = encodeClaimCookie({
      requestId: "11111111-1111-4111-8111-111111111111",
      token,
      name: "Али",
    });
    const dec = decodeClaimCookie(enc);
    assert.ok(dec);
    assert.equal(dec?.token, token);
    assert.equal(hashToken(token).length, 64);
  });

  await test("BASIC nav is small; ADVANCED keeps tools", () => {
    assert.ok(dashboardNavBasic.length <= 5);
    // UX B: idea is primary CTA, not a BASIC nav item
    assert.ok(!dashboardNavBasic.some((i) => i.href === "/idea"));
    assert.ok(dashboardNavBasic.some((i) => i.href === "/dashboard/ckr-requests"));
    assert.ok(dashboardNavAdvanced.some((i) => i.href === "/dashboard/projects"));
    assert.ok(dashboardNavAdvanced.some((i) => i.href === "/dashboard/for-you"));
  });

  await test("resolveDashboardNav progressive disclosure", () => {
    const basic = resolveDashboardNav({
      accessLevel: "basic",
      hasOrganization: false,
      hasNeeds: false,
      hasProjects: false,
      isAdmin: false,
    });
    assert.ok(!basic.some((i) => i.href === "/dashboard/projects"));
    const withOrg = resolveDashboardNav({
      accessLevel: "basic",
      hasOrganization: true,
      hasNeeds: false,
      hasProjects: false,
      isAdmin: false,
    });
    assert.ok(withOrg.some((i) => i.href === "/partner"));
    const adv = resolveDashboardNav({
      accessLevel: "advanced",
      hasOrganization: true,
      hasNeeds: true,
      hasProjects: true,
      isAdmin: false,
    });
    // UX B: needs live under Ещё, not primary
    assert.ok(!adv.some((i) => i.href === "/dashboard/needs"));
    assert.ok(adv.some((i) => i.href === "/dashboard/for-you"));
  });

  await test("LIA brief works offline (no provider)", () => {
    const brief = buildLiaBriefDraft({
      organizationName: "ТИНДА",
      requestBody: "Нужны покупатели напитков",
      region: "Дагестан",
      hasNeed: true,
      needTitle: "SEEK_BUYER",
    });
    assert.equal(brief.autoPublish, false);
    assert.ok(String(brief.client).includes("ТИНДА"));
  });

  await test("partnership mapping still intact for TINDA path", () => {
    assert.equal(partnershipTypeToCkrRequestType("supplier"), "FIND_BUYER");
  });

  await test("homepage/idea routes exist in tree", () => {
    const ideaPage = readFileSync(
      resolve("src/app/(public)/idea/page.tsx"),
      "utf8",
    );
    assert.match(ideaPage, /PublicIdeaForm/);
    const api = readFileSync(resolve("src/app/api/idea/route.ts"), "utf8");
    assert.match(api, /submitPublicIdea/);
    assert.match(api, /claimCookie/);
  });

  console.log(`\nDone: ${passed} passed, ${failed} failed\n`);
  if (failed) process.exit(1);
}

main();
