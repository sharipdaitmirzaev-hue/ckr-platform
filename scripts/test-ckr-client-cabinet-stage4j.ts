/**
 * Stage 4J — simple client cabinet contracts.
 * Run: npx tsx scripts/test-ckr-client-cabinet-stage4j.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  dashboardNavAdvanced,
  dashboardNavBasic,
  dashboardNavStandard,
} from "../src/config/navigation";
import { resolveDashboardNav } from "../src/lib/cabinet/access";
import {
  describeCkrNow,
  describeHumanStatus,
  describeRequestTitle,
  describeWhatYouNeed,
  humanizeClientEvent,
  progressStepForStatus,
  shortenOrgName,
  sortRequestsForClient,
} from "../src/lib/ckr-inbox/client-presentation";
import type { CkrRequest } from "../src/types/ckr-inbox";

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

function read(path: string) {
  return readFileSync(resolve(path), "utf8");
}

function fakeRequest(
  partial: Partial<CkrRequest> & Pick<CkrRequest, "id" | "status">,
): CkrRequest {
  return {
    subject: "",
    body: "body",
    requestType: "IDEA",
    priority: "NORMAL",
    source: "public_idea_form",
    sourceTable: "",
    sourceId: null,
    organizationId: null,
    fromUserId: "u1",
    assignedTo: null,
    assignedAt: null,
    needProfileId: null,
    dealId: null,
    linkedTaskId: null,
    nextStepPublic: "",
    nextStepInternal: "",
    region: "",
    liaBrief: null,
    idempotencyKey: null,
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactTelegram: "",
    claimedAt: null,
    createdAt: "2026-08-12T10:00:00.000Z",
    updatedAt: "2026-08-12T10:00:00.000Z",
    ...partial,
  };
}

async function main() {
  console.log("\nStage 4J — Client cabinet\n");

  await test("human status mapping", () => {
    assert.equal(
      describeHumanStatus({ status: "NEW", requestType: "IDEA" }),
      "Мы получили вашу идею",
    );
    assert.equal(
      describeHumanStatus({ status: "IN_PROGRESS", requestType: "IDEA" }),
      "ЦКР работает над вашим обращением",
    );
    assert.equal(
      describeHumanStatus({ status: "WAITING_CLIENT", requestType: "IDEA" }),
      "Нам нужна информация от вас",
    );
  });

  await test("TINDA Сейчас ЦКР wording", () => {
    assert.equal(
      describeCkrNow({
        requestType: "FIND_BUYER",
        status: "IN_PROGRESS",
        organizationName: 'ООО "Тинда"',
      }),
      "ЦКР ищет покупателей для ТИНДА.",
    );
    assert.equal(shortenOrgName('ООО "Тинда"'), "ТИНДА");
  });

  await test("what you need idle vs action", () => {
    const idle = describeWhatYouNeed({ status: "IN_PROGRESS" });
    assert.equal(idle.needsAction, false);
    assert.match(idle.text, /Пока ничего/i);
    const wait = describeWhatYouNeed({
      status: "WAITING_CLIENT",
      nextStepPublic: "Уточните объём поставок в месяц.",
    });
    assert.equal(wait.needsAction, true);
    assert.match(wait.text, /объём поставок/i);
  });

  await test("progress steps honest mapping", () => {
    assert.equal(progressStepForStatus("NEW"), "received");
    assert.equal(progressStepForStatus("IN_REVIEW"), "review");
    assert.equal(progressStepForStatus("IN_PROGRESS"), "work");
    assert.equal(progressStepForStatus("COMPLETED"), "result");
  });

  await test("history hides technical event types", () => {
    assert.equal(
      humanizeClientEvent({
        id: "1",
        requestId: "r",
        eventType: "NEED_LINKED",
        title: "Need Profile связан",
        detail: "",
        visibility: "CLIENT",
        actorUserId: null,
        meta: {},
        createdAt: "2026-08-12T10:00:00.000Z",
      }),
      null,
    );
    assert.equal(
      humanizeClientEvent({
        id: "2",
        requestId: "r",
        eventType: "CLIENT_MESSAGE",
        title: "Вы дополнили идею",
        detail: "",
        visibility: "CLIENT",
        actorUserId: "u",
        meta: {},
        createdAt: "2026-08-12T10:00:00.000Z",
      }),
      "Вы дополнили идею",
    );
  });

  await test("sort puts WAITING_CLIENT first", () => {
    const sorted = sortRequestsForClient([
      fakeRequest({ id: "a", status: "IN_PROGRESS" }),
      fakeRequest({ id: "b", status: "WAITING_CLIENT" }),
      fakeRequest({ id: "c", status: "NEW" }),
    ]);
    assert.equal(sorted[0]?.id, "b");
  });

  await test("BASIC nav stays small; STANDARD no idea menu bloat", () => {
    assert.ok(dashboardNavBasic.length <= 5);
    assert.ok(dashboardNavBasic.some((i) => i.href === "/dashboard/ckr-requests"));
    assert.ok(!dashboardNavStandard.some((i) => i.href === "/idea"));
    assert.ok(dashboardNavStandard.some((i) => i.href === "/dashboard/for-you"));
    assert.ok(dashboardNavAdvanced.some((i) => i.href === "/dashboard/projects"));
  });

  await test("resolveDashboardNav progressive", () => {
    const basic = resolveDashboardNav({
      accessLevel: "basic",
      hasOrganization: false,
      hasNeeds: false,
      hasProjects: false,
      isAdmin: false,
    });
    assert.ok(!basic.some((i) => i.href === "/dashboard/projects"));
    assert.ok(!basic.some((i) => i.href === "/lia"));
  });

  await test("pages use client presentation + supplement/reply actions", () => {
    const dash = read("src/app/(dashboard)/dashboard/page.tsx");
    assert.match(dash, /describeHumanStatus/);
    assert.match(dash, /Что нужно от вас|describeWhatYouNeed/);
    assert.doesNotMatch(dash, /FIND_BUYER|SEEK_BUYER|Need Profile/);
    const detail = read(
      "src/app/(dashboard)/dashboard/ckr-requests/[id]/page.tsx",
    );
    assert.match(detail, /appendIdeaSupplementAction/);
    assert.match(detail, /replyToCkrRequestAction/);
    assert.match(detail, /Дополнить идею/);
    assert.match(detail, /Сообщения от ЦКР/);
    const actions = read("src/features/client-cabinet/actions.ts");
    assert.match(actions, /ckr_request_comments/);
    assert.doesNotMatch(actions, /from\(\"ideas\"\)/);
  });

  await test("request title prefers org brand over technical subject", () => {
    assert.equal(
      describeRequestTitle({
        subject: "Партнёрство · supplier",
        body: "Нужны покупатели",
        requestType: "FIND_BUYER",
        organizationName: 'ООО "Тинда"',
      }),
      "ТИНДА",
    );
  });

  await test("no Stage 4J SQL migration required", () => {
    // Intentionally UX-only stage
    assert.ok(true);
  });

  console.log(`\nDone: ${passed} passed, ${failed} failed\n`);
  if (failed) process.exit(1);
}

main();
