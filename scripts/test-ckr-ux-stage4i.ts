/**
 * Stage 4I — public UX consolidation (contracts + copy + nav).
 * Run: npx tsx scripts/test-ckr-ux-stage4i.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LANDING } from "../src/config/landing";
import { IDEA_FORM } from "../src/config/idea-first";
import {
  dashboardNavAdvanced,
  dashboardNavBasic,
  dashboardNavStandard,
  publicNav,
} from "../src/config/navigation";
import { resolveDashboardNav } from "../src/lib/cabinet/access";
import { sanitizeIdeaInput } from "../src/lib/idea-first/security";

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
  console.log("\nStage 4I — Public UX consolidation\n");

  await test("landing copy has motto + two CTAs only", () => {
    assert.match(LANDING.fullName, /ЦЕНТР КОМПЛЕКСНЫХ РЕШЕНИЙ/i);
    assert.match(LANDING.motto, /ПАРТНЁРСТВО/i);
    assert.equal(LANDING.primaryCta.href, "/idea");
    assert.equal(LANDING.secondaryCta.href, "/login");
    assert.ok(LANDING.mission.length >= 2 && LANDING.mission.length <= 4);
    assert.match(LANDING.mission.join(" "), /объединяет идеи/i);
  });

  await test("client presentation: TINDA buyers + IDEA review", () => {
    const {
      describeCkrNow,
      describeNextStepPublic,
    } = require("../src/lib/ckr-inbox/client-presentation") as typeof import("../src/lib/ckr-inbox/client-presentation");
    assert.equal(
      describeCkrNow({
        requestType: "FIND_BUYER",
        status: "IN_PROGRESS",
        organizationName: "ТИНДА",
      }),
      "ЦКР ищет покупателей для ТИНДА.",
    );
    assert.equal(
      describeCkrNow({
        requestType: "IDEA",
        status: "NEW",
      }),
      "ЦКР изучает вашу идею.",
    );
    assert.match(
      describeNextStepPublic({ status: "IN_PROGRESS" }),
      /Пока ничего|не требуется/i,
    );
  });

  await test("homepage is chrome-free idea-first screen", () => {
    const page = read("src/app/(public)/page.tsx");
    assert.match(page, /LANDING/);
    assert.match(page, /Расскажите нам вашу идею|primaryCta/);
    assert.doesNotMatch(page, /listPublishedProjects/);
    assert.doesNotMatch(page, /PublicLiaEntry/);
    assert.doesNotMatch(page, /OpportunityCard/);
    assert.doesNotMatch(page, /MARKETPLACE_HERO/);
    const chrome = read("src/components/layout/public-chrome.tsx");
    assert.match(chrome, /isLanding/);
    assert.match(chrome, /pathname === \"\/\"/);
    const widget = read("src/components/lia/lia-widget.tsx");
    assert.match(widget, /pathname === \"\/\"/);
    assert.match(widget, /pathname === \"\/idea\"/);
  });

  await test("idea form shows phone/email contact fields on one screen", () => {
    const form = read(
      "src/features/idea-first/components/public-idea-form.tsx",
    );
    assert.match(form, /contactPhoneLabel|Телефон/);
    assert.match(form, /contactEmailLabel|Электронная почта/);
    assert.match(form, /contactTitle|Как с вами связаться/);
    assert.match(form, /phone/);
    assert.match(form, /email/);
    assert.match(form, /Создать аккаунт|createCabinet/);
    assert.match(form, /Сделать это позже|doLater/);
    assert.match(form, /claim=1/);
    assert.match(IDEA_FORM.contactPrompt, /телефон или почту/i);
  });

  await test("contacts remain optional in sanitize (empty ok)", () => {
    const ok = sanitizeIdeaInput({
      name: "Али",
      idea:
        "Хочу построить небольшую гостиницу в Дагестане. Ищу землю и инвестора.",
    });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.data.phone, "");
      assert.equal(ok.data.email, "");
      assert.equal(ok.data.telegram, "");
    }
  });

  await test("public nav is light; catalogs not in header nav", () => {
    assert.ok(publicNav.length <= 4);
    assert.ok(!publicNav.some((i) => i.href === "/projects"));
    assert.ok(!publicNav.some((i) => i.href === "/opportunities"));
    assert.ok(!publicNav.some((i) => i.href === "/lia"));
    const header = read("src/components/layout/site-header.tsx");
    assert.match(header, /publicNav/);
    assert.doesNotMatch(header, /mainNav/);
  });

  await test("BASIC menu stays simple; STANDARD/ADVANCED keep tools", () => {
    assert.ok(dashboardNavBasic.length <= 5);
    assert.ok(
      dashboardNavBasic.every((i) =>
        [
          "/dashboard",
          "/dashboard/ckr-requests",
          "/idea",
          "/dashboard/settings",
        ].includes(i.href),
      ),
    );
    // UX B: primary STANDARD uses «Возможности»; needs under Ещё
    assert.ok(dashboardNavStandard.some((i) => i.label === "Возможности"));
    assert.ok(dashboardNavStandard.some((i) => i.href === "/dashboard/for-you"));
    assert.ok(!dashboardNavStandard.some((i) => i.href === "/idea"));
    assert.ok(
      dashboardNavAdvanced.some((i) => i.href === "/dashboard/projects"),
    );
    assert.ok(
      dashboardNavAdvanced.some((i) => i.href === "/dashboard/applications"),
    );
  });

  await test("progressive access still resolves without LIA", () => {
    const basic = resolveDashboardNav({
      accessLevel: "basic",
      hasOrganization: false,
      hasNeeds: false,
      hasProjects: false,
      isAdmin: false,
    });
    assert.ok(!basic.some((i) => i.href === "/lia"));
    assert.ok(!basic.some((i) => i.href === "/dashboard/for-you"));
  });

  await test("register copy no longer forces LIA entry", () => {
    const reg = read("src/app/(auth)/register/page.tsx");
    assert.doesNotMatch(reg, /Путь: Главная → Лия/);
    assert.doesNotMatch(reg, /href=\"\/lia\"/);
    assert.match(reg, /\/idea/);
  });

  await test("Stage 4H claim API surface unchanged", () => {
    const api = read("src/app/api/idea/route.ts");
    assert.match(api, /submitPublicIdea/);
    assert.match(api, /claimCookie/);
    const mig = read(
      "supabase/migrations/20260812190000_ckr_idea_first_stage4h.sql",
    );
    assert.match(mig, /submit_public_idea/);
    assert.match(mig, /claim_ckr_request/);
  });

  await test("no new ideas table / no 4I migration required", () => {
    assert.equal(
      readFileSync(
        resolve("supabase/migrations/20260812190000_ckr_idea_first_stage4h.sql"),
      ).length > 0,
      true,
    );
    // Stage 4I intentionally has no SQL migration file.
    const page = read("src/app/(public)/page.tsx");
    assert.doesNotMatch(page, /from\(\"ideas\"\)/);
  });

  console.log(`\nDone: ${passed} passed, ${failed} failed\n`);
  if (failed) process.exit(1);
}

main();
