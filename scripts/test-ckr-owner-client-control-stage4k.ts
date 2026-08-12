/**
 * Stage 4K — Owner Inbox client cabinet controls.
 * Run: npx tsx scripts/test-ckr-owner-client-control-stage4k.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  describeCkrNow,
  describeWhatYouNeed,
  humanizeClientEvent,
} from "../src/lib/ckr-inbox/client-presentation";
import {
  CLIENT_MESSAGE_TEMPLATES,
  NEXT_STEP_TEMPLATES,
  OWNER_SCENARIOS,
  PUBLIC_ACTIVITY_TEMPLATES,
  buildClientFacingPreview,
  describeScenarioChanges,
  resolvePublicActivityMode,
  sanitizePublicText,
  waitingClientNeedsNextStepWarning,
} from "../src/lib/ckr-inbox/owner-client-control";

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

async function main() {
  console.log("\nStage 4K — Owner client control\n");

  await test("AUTO public activity (TINDA)", () => {
    assert.equal(
      describeCkrNow({
        requestType: "FIND_BUYER",
        status: "IN_PROGRESS",
        organizationName: 'ООО "Тинда"',
      }),
      "ЦКР ищет покупателей для ТИНДА.",
    );
    assert.equal(
      resolvePublicActivityMode(""),
      "AUTO",
    );
  });

  await test("CUSTOM public activity overrides AUTO", () => {
    const custom =
      "ЦКР проверяет доступные меры господдержки и варианты финансирования.";
    assert.equal(
      describeCkrNow({
        requestType: "FIND_BUYER",
        status: "IN_PROGRESS",
        organizationName: 'ООО "Тинда"',
        publicActivityText: custom,
      }),
      custom,
    );
    assert.equal(resolvePublicActivityMode(custom), "CUSTOM");
  });

  await test("fallback when custom empty", () => {
    assert.equal(
      describeCkrNow({
        requestType: "IDEA",
        status: "IN_REVIEW",
        publicActivityText: "   ",
      }),
      "ЦКР изучает вашу идею.",
    );
  });

  await test("sanitize strips HTML and enforces length", () => {
    const cleaned = sanitizePublicText(
      "<b>ЦКР</b> ищет покупателей.",
      280,
    );
    assert.equal(cleaned.ok, true);
    if (cleaned.ok) {
      assert.equal(cleaned.text, "ЦКР ищет покупателей.");
    }
    const long = sanitizePublicText("x".repeat(400), 280);
    assert.equal(long.ok, false);
  });

  await test("next step + clear idle", () => {
    const need = describeWhatYouNeed({
      status: "IN_PROGRESS",
      nextStepPublic: "Уточните бюджет проекта.",
    });
    assert.equal(need.needsAction, true);
    assert.match(need.text, /бюджет/i);
    const idle = describeWhatYouNeed({
      status: "IN_PROGRESS",
      nextStepPublic: "",
    });
    assert.equal(idle.needsAction, false);
    assert.match(idle.text, /Пока ничего.*ЦКР работает/i);
  });

  await test("WAITING_CLIENT warning", () => {
    assert.equal(
      waitingClientNeedsNextStepWarning({
        status: "WAITING_CLIENT",
        nextStepPublic: "",
      }),
      true,
    );
    assert.equal(
      waitingClientNeedsNextStepWarning({
        status: "WAITING_CLIENT",
        nextStepPublic: "Уточните регион.",
      }),
      false,
    );
    assert.equal(
      waitingClientNeedsNextStepWarning({
        status: "IN_PROGRESS",
        nextStepPublic: "",
      }),
      false,
    );
  });

  await test("IDEA case AUTO + next step", () => {
    const now = describeCkrNow({
      requestType: "IDEA",
      status: "IN_REVIEW",
    });
    assert.equal(now, "ЦКР изучает вашу идею.");
    const need = describeWhatYouNeed({
      status: "IN_PROGRESS",
      nextStepPublic:
        "Уточните, какую сумму вы готовы вложить самостоятельно.",
    });
    assert.match(need.text, /сумму/i);
  });

  await test("preview builder", () => {
    const preview = buildClientFacingPreview({
      status: "IN_PROGRESS",
      requestType: "FIND_BUYER",
      organizationName: 'ООО "Тинда"',
      publicActivityText: "",
      nextStepPublic: "",
      lastClientMessage: "Ваша заявка принята в работу.",
    });
    assert.equal(preview.statusLabel, "В работе");
    assert.equal(preview.ckrNow, "ЦКР ищет покупателей для ТИНДА.");
    assert.match(preview.whatYouNeed, /Пока ничего/i);
    assert.match(preview.lastClientMessage, /принята/i);
  });

  await test("templates and scenarios present", () => {
    assert.ok(PUBLIC_ACTIVITY_TEMPLATES.length >= 5);
    assert.ok(NEXT_STEP_TEMPLATES.length >= 5);
    assert.ok(CLIENT_MESSAGE_TEMPLATES.length >= 3);
    assert.ok(OWNER_SCENARIOS.some((s) => s.id === "accepted_in_work"));
    assert.ok(OWNER_SCENARIOS.some((s) => s.id === "need_info"));
    assert.ok(OWNER_SCENARIOS.some((s) => s.id === "found_options"));
    const lines = describeScenarioChanges(
      OWNER_SCENARIOS.find((s) => s.id === "accepted_in_work")!,
      {
        status: "NEW",
        publicActivityText: "",
        nextStepPublic: "",
      },
    );
    assert.ok(lines.some((l) => /Статус/i.test(l)));
  });

  await test("audit event humanized for client", () => {
    assert.equal(
      humanizeClientEvent({
        id: "1",
        requestId: "r",
        eventType: "PUBLIC_ACTIVITY_UPDATED",
        title: "PUBLIC_ACTIVITY_UPDATED",
        detail: "x",
        visibility: "CLIENT",
        actorUserId: "staff",
        meta: {},
        createdAt: "2026-08-12T10:00:00.000Z",
      }),
      "ЦКР обновил информацию по вашему обращению.",
    );
    assert.equal(
      humanizeClientEvent({
        id: "2",
        requestId: "r",
        eventType: "NEXT_STEP_UPDATED",
        title: "NEXT_STEP_UPDATED",
        detail: "y",
        visibility: "CLIENT",
        actorUserId: "staff",
        meta: {},
        createdAt: "2026-08-12T10:00:00.000Z",
      }),
      "ЦКР обновил информацию по вашему обращению.",
    );
  });

  await test("owner UI wires controls + separation", () => {
    const panel = read(
      "src/features/ckr-inbox/components/owner-client-cabinet-panel.tsx",
    );
    assert.match(panel, /Что видит клиент/);
    assert.match(panel, /Клиент увидит/);
    assert.match(panel, /Внутренняя заметка ЦКР/);
    assert.match(panel, /Это увидит клиент/);
    assert.match(panel, /Видно только сотрудникам ЦКР/);
    assert.match(panel, /От клиента ничего не требуется/);
    assert.match(panel, /activityMode/);
    assert.match(panel, /confirmScenario/);
    const detail = read("src/app/(admin)/admin/owner/inbox/[id]/page.tsx");
    assert.match(detail, /OwnerClientCabinetPanel/);
    const actions = read(
      "src/features/ckr-inbox/owner-client-control-actions.ts",
    );
    assert.match(actions, /requireStaff/);
    assert.match(actions, /public_activity_text/);
    assert.match(actions, /next_step_public/);
    assert.match(actions, /PUBLIC_ACTIVITY_UPDATED/);
    assert.match(actions, /NEXT_STEP_UPDATED/);
    assert.match(actions, /await requireStaff/);
  });

  await test("client pages consume publicActivityText", () => {
    const detail = read(
      "src/app/(dashboard)/dashboard/ckr-requests/[id]/page.tsx",
    );
    assert.match(detail, /publicActivityText/);
    const dash = read("src/app/(dashboard)/dashboard/page.tsx");
    assert.match(dash, /publicActivityText/);
  });

  await test("client cannot call owner control actions from client cabinet", () => {
    const clientActions = read("src/features/client-cabinet/actions.ts");
    assert.doesNotMatch(clientActions, /public_activity_text/);
    assert.doesNotMatch(clientActions, /updatePublicActivityAction/);
    assert.doesNotMatch(clientActions, /updateNextStepPublicAction/);
  });

  await test("inbox list badges + filters reused", () => {
    const list = read("src/app/(admin)/admin/owner/inbox/page.tsx");
    assert.match(list, /Ждём клиента/);
    assert.match(list, /Нужно действие ЦКР/);
    assert.match(list, /bucket/);
    assert.match(list, /assignedTo|assigneeNames/);
  });

  await test("migration additive public_activity_text prepared", () => {
    const mig = read(
      "supabase/migrations/20260812210000_ckr_owner_client_control_stage4k.sql",
    );
    assert.match(mig, /public_activity_text/);
    assert.match(mig, /ADD COLUMN IF NOT EXISTS/);
    assert.doesNotMatch(mig, /DROP TABLE/i);
    assert.doesNotMatch(mig, /jsonb/i);
  });

  await test("mobile presentation contract (stacked panel)", () => {
    const panel = read(
      "src/features/ckr-inbox/components/owner-client-cabinet-panel.tsx",
    );
    assert.match(panel, /flex-wrap/);
    assert.match(panel, /space-y-/);
    assert.doesNotMatch(panel, /min-w-\[80rem\]|w-\[1200/);
  });

  console.log(`\nDone: ${passed} passed, ${failed} failed\n`);
  if (failed) process.exit(1);
}

main();
