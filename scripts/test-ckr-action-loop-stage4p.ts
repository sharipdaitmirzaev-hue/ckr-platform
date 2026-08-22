/**
 * Stage 4P — Request → Action → Result tests (in-memory, no production writes).
 * Run: npm run test:ckr-action-loop-stage4p
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ACTION_EVENT,
  CKR_ACTION_TYPES,
  CKR_OUTCOME_CODES,
  ckrActionTypeLabels,
  ckrOutcomePublic,
} from "../src/config/ckr-action-loop";
import {
  deriveActionsFromEvents,
  hasSharedCandidateInEvents,
  toClientActionLoopView,
  toPublicAction,
  type ActionLoopEventRow,
} from "../src/lib/ckr-action-loop/derive";
import {
  CLAIM_DASHBOARD_PATH,
  isClaimNextPath,
  resolvePostAuthRedirect,
} from "../src/lib/idea-first/claim-redirect";
import type { CkrActionEventMeta } from "../src/types/ckr-action-loop";

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

function ev(
  partial: Partial<ActionLoopEventRow> &
    Pick<ActionLoopEventRow, "id" | "eventType" | "createdAt"> & {
      meta: CkrActionEventMeta;
    },
): ActionLoopEventRow {
  return {
    id: partial.id,
    eventType: partial.eventType,
    createdAt: partial.createdAt,
    meta: partial.meta as unknown as Record<string, unknown>,
    visibility: partial.visibility,
  };
}

const ACTION_ID = "act-tinda-1";
const REQUEST_ID = "req-tinda-1";

function tindaLifecycleEvents(): ActionLoopEventRow[] {
  return [
    ev({
      id: "e1",
      eventType: "CANDIDATE_SHARED",
      createdAt: "2026-08-22T10:00:00.000Z",
      visibility: "CLIENT",
      meta: {
        stage4p: true,
        action_id: "share-only",
      },
    }),
    ev({
      id: "e2",
      eventType: ACTION_EVENT.created,
      createdAt: "2026-08-22T10:01:00.000Z",
      visibility: "CLIENT",
      meta: {
        stage4p: true,
        action_id: ACTION_ID,
        action_type: "CONTACT",
        status: "TODO",
        responsible: "CKR",
        item_title: "Закупщик продуктов питания · Дагестан",
        item_type: "opportunity",
        item_id: "opp-food-1",
        note_internal: "SECRET_INTERNAL_PHONE",
        note_public: "Ничего не требуется",
      },
    }),
    ev({
      id: "e3",
      eventType: ACTION_EVENT.status,
      createdAt: "2026-08-22T10:02:00.000Z",
      visibility: "CLIENT",
      meta: {
        stage4p: true,
        action_id: ACTION_ID,
        status: "IN_PROGRESS",
      },
    }),
    ev({
      id: "e4",
      eventType: ACTION_EVENT.outcome,
      createdAt: "2026-08-22T10:03:00.000Z",
      visibility: "CLIENT",
      meta: {
        stage4p: true,
        action_id: ACTION_ID,
        status: "DONE",
        outcome: "SUCCESS",
        outcome_comment: "Закупщик запросил коммерческое предложение",
        next_action_type: "SEND_OFFER",
      },
    }),
    ev({
      id: "e5",
      eventType: ACTION_EVENT.created,
      createdAt: "2026-08-22T10:04:00.000Z",
      visibility: "CLIENT",
      meta: {
        stage4p: true,
        action_id: "act-tinda-2",
        action_type: "SEND_OFFER",
        status: "TODO",
        responsible: "CKR",
        item_title: "Закупщик продуктов питания · Дагестан",
      },
    }),
  ];
}

async function main() {
  await test("1. opportunity → action (create CONTACT)", () => {
    const actions = deriveActionsFromEvents(
      [
        ev({
          id: "e2",
          eventType: ACTION_EVENT.created,
          createdAt: "2026-08-22T10:01:00.000Z",
          meta: {
            stage4p: true,
            action_id: ACTION_ID,
            action_type: "CONTACT",
            status: "TODO",
            responsible: "CKR",
            item_title: "Buyer Co",
          },
        }),
      ],
      { requestId: REQUEST_ID },
    );
    assert.equal(actions.length, 1);
    assert.equal(actions[0].actionType, "CONTACT");
    assert.equal(actions[0].status, "TODO");
    assert.equal(actions[0].itemTitle, "Buyer Co");
  });

  await test("2. action → in progress", () => {
    const actions = deriveActionsFromEvents(
      [
        ev({
          id: "e2",
          eventType: ACTION_EVENT.created,
          createdAt: "2026-08-22T10:01:00.000Z",
          meta: {
            stage4p: true,
            action_id: ACTION_ID,
            action_type: "CONTACT",
            status: "TODO",
            responsible: "CKR",
          },
        }),
        ev({
          id: "e3",
          eventType: ACTION_EVENT.status,
          createdAt: "2026-08-22T10:02:00.000Z",
          meta: {
            stage4p: true,
            action_id: ACTION_ID,
            status: "IN_PROGRESS",
          },
        }),
      ],
      { requestId: REQUEST_ID },
    );
    assert.equal(actions[0].status, "IN_PROGRESS");
  });

  await test("3. action → done", () => {
    const actions = deriveActionsFromEvents(tindaLifecycleEvents(), {
      requestId: REQUEST_ID,
    });
    const first = actions.find((a) => a.id === ACTION_ID)!;
    assert.equal(first.status, "DONE");
  });

  await test("4. done → outcome (SUCCESS + comment)", () => {
    const actions = deriveActionsFromEvents(tindaLifecycleEvents(), {
      requestId: REQUEST_ID,
    });
    const first = actions.find((a) => a.id === ACTION_ID)!;
    assert.equal(first.outcome, "SUCCESS");
    assert.match(first.outcomeComment, /коммерческое предложение/i);
  });

  await test("5. outcome → next action (SEND_OFFER)", () => {
    const actions = deriveActionsFromEvents(tindaLifecycleEvents(), {
      requestId: REQUEST_ID,
    });
    const first = actions.find((a) => a.id === ACTION_ID)!;
    assert.equal(first.nextActionType, "SEND_OFFER");
    const next = actions.find((a) => a.id === "act-tinda-2");
    assert.ok(next);
    assert.equal(next!.actionType, "SEND_OFFER");
    assert.equal(next!.status, "TODO");
  });

  await test("6. client sees public representation (no enums)", () => {
    const actions = deriveActionsFromEvents(tindaLifecycleEvents(), {
      requestId: REQUEST_ID,
      includeInternalNotes: false,
    });
    const view = toClientActionLoopView(actions, { hasSharedOpportunity: true });
    assert.ok(view);
    assert.match(view!.foundLabel, /вариант/i);
    assert.ok(view!.nowLabel);
    assert.ok(view!.fromYouLabel);
    assert.ok(view!.resultLabel);
    assert.doesNotMatch(view!.nowLabel, /\bIN_PROGRESS\b/);
    assert.doesNotMatch(view!.resultLabel!, /\bSUCCESS\b/);
    assert.match(view!.resultLabel!, /коммерческое предложение/i);
  });

  await test("7. internal note not visible to client", () => {
    const withInternal = deriveActionsFromEvents(tindaLifecycleEvents(), {
      requestId: REQUEST_ID,
      includeInternalNotes: true,
    });
    assert.match(withInternal.find((a) => a.id === ACTION_ID)!.noteInternal, /SECRET/);

    const publicOnly = deriveActionsFromEvents(tindaLifecycleEvents(), {
      requestId: REQUEST_ID,
      includeInternalNotes: false,
    });
    assert.equal(publicOnly.find((a) => a.id === ACTION_ID)!.noteInternal, "");

    const stripped = toPublicAction(withInternal.find((a) => a.id === ACTION_ID)!);
    assert.equal(stripped.noteInternal, "");
    assert.doesNotMatch(JSON.stringify(stripped), /SECRET_INTERNAL/);
  });

  await test("8. client CTA works (WAITING CLIENT → response)", () => {
    const events: ActionLoopEventRow[] = [
      ev({
        id: "c1",
        eventType: ACTION_EVENT.created,
        createdAt: "2026-08-22T11:00:00.000Z",
        meta: {
          stage4p: true,
          action_id: "act-cta",
          action_type: "TRANSFER_TO_CLIENT",
          status: "WAITING",
          responsible: "CLIENT",
          item_title: "Вариант для решения",
          note_public: "Подтвердите, что хотите отправить предложение",
        },
      }),
      ev({
        id: "c2",
        eventType: ACTION_EVENT.clientCta,
        createdAt: "2026-08-22T11:01:00.000Z",
        meta: {
          stage4p: true,
          action_id: "act-cta",
          client_cta: "INTERESTED",
          status: "IN_PROGRESS",
          note_public: "Клиент: Интересно",
        },
      }),
    ];
    const actions = deriveActionsFromEvents(events, { requestId: REQUEST_ID });
    assert.equal(actions[0].clientCta, "INTERESTED");
    assert.equal(actions[0].status, "IN_PROGRESS");

    const before = toClientActionLoopView(
      deriveActionsFromEvents([events[0]], { requestId: REQUEST_ID }),
    );
    assert.ok(before?.needsClientDecision);
    assert.ok(before!.allowedCtas.includes("INTERESTED"));
  });

  await test("9. idea claim after registration — redirect helper", () => {
    const path = resolvePostAuthRedirect({
      hasPendingClaim: true,
      nextPath: null,
      roleDefaultPath: "/lia?intent=idea",
    });
    assert.equal(path, CLAIM_DASHBOARD_PATH);
    assert.notEqual(path, "/lia?intent=idea");
  });

  await test("10. pending claim has correct redirect priority", () => {
    assert.equal(
      resolvePostAuthRedirect({
        hasPendingClaim: false,
        nextPath: "/dashboard?claim=1",
        roleDefaultPath: "/lia",
      }),
      CLAIM_DASHBOARD_PATH,
    );
    assert.equal(
      resolvePostAuthRedirect({
        hasPendingClaim: false,
        nextPath: null,
        roleDefaultPath: "/lia",
      }),
      "/lia",
    );
    assert.ok(isClaimNextPath("/dashboard?claim=1"));
    assert.ok(!isClaimNextPath("/lia"));
  });

  await test("11. BASIC client does not get internal/admin fields", () => {
    const actions = deriveActionsFromEvents(tindaLifecycleEvents(), {
      includeInternalNotes: false,
    });
    const view = toClientActionLoopView(actions)!;
    const viewPayload = JSON.stringify(view);
    assert.doesNotMatch(viewPayload, /SECRET_INTERNAL/);
    assert.doesNotMatch(viewPayload, /\bIN_PROGRESS\b/);
    assert.doesNotMatch(viewPayload, /\bSUCCESS\b/);
    assert.doesNotMatch(viewPayload, /noteInternal/);
    assert.ok(view.resultLabel && !view.resultLabel.includes("SUCCESS"));
    for (const a of actions.map(toPublicAction)) {
      assert.equal(a.noteInternal, "");
    }
  });

  await test("12. TINDA acceptance flow (SEEK_BUYER path without Matching)", () => {
    assert.ok(hasSharedCandidateInEvents(tindaLifecycleEvents()));
    const actions = deriveActionsFromEvents(tindaLifecycleEvents(), {
      requestId: REQUEST_ID,
    });
    // CONTACT → IN_PROGRESS → DONE SUCCESS → next SEND_OFFER
    const contact = actions.find((a) => a.id === ACTION_ID)!;
    assert.equal(contact.actionType, "CONTACT");
    assert.equal(contact.status, "DONE");
    assert.equal(contact.outcome, "SUCCESS");
    assert.equal(contact.nextActionType, "SEND_OFFER");
    const offer = actions.find((a) => a.actionType === "SEND_OFFER");
    assert.ok(offer);

    const view = toClientActionLoopView(actions, { hasSharedOpportunity: true })!;
    assert.match(view.foundLabel, /вариант/i);
    assert.match(view.resultLabel || "", /коммерческое предложение/i);
    // No Matching Engine references required
    const discovery = read("src/lib/ckr-action-loop/derive.ts");
    assert.doesNotMatch(discovery, /MatchingEngine|runMatching|auto.?outreach/i);
  });

  await test("action types / outcomes vocabulary complete", () => {
    assert.ok(CKR_ACTION_TYPES.includes("CONTACT"));
    assert.ok(CKR_ACTION_TYPES.includes("SEND_OFFER"));
    assert.ok(CKR_OUTCOME_CODES.includes("SUCCESS"));
    assert.ok(CKR_OUTCOME_CODES.includes("NOT_RELEVANT"));
    assert.equal(ckrActionTypeLabels.CONTACT, "Связаться");
    assert.match(ckrOutcomePublic.SUCCESS, /результат/i);
  });

  await test("Operator One Desk wired on inbox detail", () => {
    const page = read("src/app/(admin)/admin/owner/inbox/[id]/page.tsx");
    assert.match(page, /OwnerOneDesk/);
    assert.doesNotMatch(
      page,
      /<OwnerRequestDiscoveryPanel[\s\S]*<OwnerDemandWorkbench/,
    );
    const desk = read(
      "src/features/ckr-action-loop/components/owner-one-desk.tsx",
    );
    assert.match(desk, /Поиск и возможности/);
    assert.match(desk, /OwnerRequestDiscoveryPanel/);
    assert.match(desk, /OwnerDemandWorkbench/);
    assert.match(desk, /OwnerActionLoopPanel/);
  });

  await test("client page shows Action Loop card", () => {
    const page = read("src/app/(dashboard)/dashboard/ckr-requests/[id]/page.tsx");
    assert.match(page, /ClientActionLoopCard/);
    assert.match(page, /includeInternalNotes: false/);
  });

await test("register/onboarding/login preserve claim priority", () => {
  const auth = read("src/features/auth/actions.ts");
  assert.match(auth, /resolvePostAuthRedirect|isClaimNextPath/);
  assert.match(auth, /claimCookie|decodeClaimCookie/);
  // login must also prefer pending claim cookie (not only register/onboarding)
  assert.match(auth, /loginAction[\s\S]*CLAIM_DASHBOARD_PATH|loginAction[\s\S]*decodeClaimCookie/);
  const reg = read("src/features/auth/components/register-form.tsx");
  assert.match(reg, /name="next"/);
  const onb = read("src/features/auth/components/onboarding-form.tsx");
  assert.match(onb, /name="next"/);
});

  await test("no new SoT table / no Matching / no Scheduler", () => {
    const persist = read("src/lib/ckr-action-loop/persist.ts");
    assert.match(persist, /ckr_request_events/);
    assert.doesNotMatch(persist, /ckr_request_actions/);
    const actions = read("src/features/ckr-action-loop/actions.ts");
    assert.doesNotMatch(actions, /MatchingEngine|Synthesis|Scheduler/);
    // client cannot set outcome
    assert.match(actions, /submitClientActionCtaAction/);
    assert.match(actions, /Недостаточно прав/);
  });

  await test("security: client CTA rejects outcome/noteInternal", () => {
    const src = read("src/features/ckr-action-loop/actions.ts");
    assert.match(src, /formData\.get\("outcome"\)/);
    assert.match(src, /formData\.get\("noteInternal"\)/);
    assert.match(src, /requireStaff/);
    assert.match(src, /assertClientOwnsRequest/);
  });


  console.log(`\nStage 4P: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
