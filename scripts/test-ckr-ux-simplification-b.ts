/**
 * UX Simplification B (BALANCED) — presentation contracts.
 * Run: npx tsx scripts/test-ckr-ux-simplification-b.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  adminStageArchiveNav,
  adminNavItems,
} from "../src/config/admin";
import {
  dashboardNavMore,
  dashboardNavPrimary,
  operatorPrimaryNav,
  operatorSystemNav,
  publicNav,
} from "../src/config/navigation";
import { partnerNav, partnerNavMore } from "../src/config/partners";
import {
  CLIENT_STATUS_LABELS,
  humanNeedStatus,
  UX_CTA,
} from "../src/config/ux-simplification";
import {
  resolveDashboardMoreNav,
  resolveDashboardNav,
} from "../src/lib/cabinet/access";

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
  console.log("\nUX Simplification B — BALANCED\n");

  await test("public nav: О ЦКР + Контакты only", () => {
    assert.deepEqual(
      publicNav.map((i) => i.href),
      ["/about", "/contacts"],
    );
  });

  await test("client primary nav vocabulary", () => {
    const labels = dashboardNavPrimary.map((i) => i.label);
    assert.ok(labels.includes("Главная"));
    assert.ok(labels.includes("Обращения"));
    assert.ok(labels.includes("Возможности"));
    assert.ok(labels.includes("Профиль"));
    assert.ok(!labels.includes("Need Profiles"));
    assert.ok(!labels.some((l) => /Feed|LIA|Marketplace|Investments/i.test(l)));
  });

  await test("BASIC / STANDARD / ADVANCED primary counts", () => {
    const basic = resolveDashboardNav({
      accessLevel: "basic",
      hasOrganization: false,
      hasNeeds: false,
      hasProjects: false,
      isAdmin: false,
    });
    const standard = resolveDashboardNav({
      accessLevel: "standard",
      hasOrganization: true,
      hasNeeds: true,
      hasProjects: false,
      isAdmin: false,
    });
    const advanced = resolveDashboardNav({
      accessLevel: "advanced",
      hasOrganization: true,
      hasNeeds: true,
      hasProjects: true,
      isAdmin: false,
    });
    assert.equal(basic.length, 3); // home, requests, profile
    assert.ok(basic.every((i) => !["/lia", "/dashboard/needs"].includes(i.href)));
    assert.ok(standard.some((i) => i.href === "/partner"));
    assert.ok(standard.some((i) => i.href === "/dashboard/for-you"));
    assert.ok(standard.length <= 5);
    assert.equal(advanced.length, standard.length); // same primary
    const moreAdv = resolveDashboardMoreNav({
      accessLevel: "advanced",
      hasOrganization: true,
      hasNeeds: true,
      hasProjects: true,
      isAdmin: false,
    });
    assert.ok(moreAdv.some((i) => i.href === "/dashboard/projects"));
    assert.ok(moreAdv.length >= dashboardNavMore.length - 1);
  });

  await test("company nav simplified", () => {
    assert.equal(partnerNav.length, 5);
    assert.ok(partnerNav.some((i) => i.label === "О компании"));
    assert.ok(partnerNav.some((i) => i.label === "Обращения"));
    assert.ok(partnerNav.some((i) => i.label === "Возможности"));
    assert.ok(partnerNavMore.some((i) => i.href === "/partner/profile"));
  });

  await test("operator primary excludes System tools", () => {
    const labels = operatorPrimaryNav.map((i) => i.label);
    assert.deepEqual(labels, [
      "Главная",
      "Заявки",
      "Компании",
      "Возможности",
      "Поиск",
      "Задачи",
    ]);
    const systemHrefs = operatorSystemNav.map((i) => i.href);
    assert.ok(systemHrefs.includes("/admin/owner/lia"));
    assert.ok(systemHrefs.includes("/admin/owner/publishing"));
    assert.ok(systemHrefs.includes("/admin/owner/graph"));
    assert.ok(systemHrefs.includes("/admin/owner/feed"));
    assert.ok(adminStageArchiveNav.some((i) => i.href === "/admin/pilot"));
    assert.ok(adminNavItems.some((i) => i.href === "/admin/owner/inbox"));
  });

  await test("human status + CTA vocabulary", () => {
    assert.equal(humanNeedStatus("ACTIVE"), CLIENT_STATUS_LABELS.in_progress);
    assert.equal(humanNeedStatus("DRAFT"), CLIENT_STATUS_LABELS.received);
    assert.equal(UX_CTA.newRequest, "Новое обращение");
    assert.equal(UX_CTA.findVariants, "Найти варианты");
    assert.equal(UX_CTA.showClient, "Показать клиенту");
  });

  await test("client home answers 3 questions", () => {
    const page = read("src/app/(dashboard)/dashboard/page.tsx");
    assert.match(page, /Сейчас ЦКР/);
    assert.match(page, /Найдено/);
    assert.match(page, /От вас/);
    assert.match(page, /Новое обращение|UX_CTA\.newRequest/);
    assert.doesNotMatch(page, /Matching Engine|Controlled Publish|Need Profile/);
  });

  await test("opportunities hub has tabs", () => {
    const page = read("src/app/(dashboard)/dashboard/for-you/page.tsx");
    assert.match(page, /Для вас/);
    assert.match(page, /Сохранённые/);
    assert.match(page, /Все/);
  });

  await test("admin sidebar uses System bucket", () => {
    const side = read("src/components/admin/admin-sidebar.tsx");
    assert.match(side, /operatorPrimaryNav/);
    assert.match(side, /Система/);
    assert.match(side, /adminStageArchiveNav/);
  });

  await test("footer has «Ещё на сайте» catalogs", () => {
    const footer = read("src/components/layout/site-footer.tsx");
    assert.match(footer, /Ещё на сайте/);
    assert.match(footer, /\/projects/);
    assert.match(footer, /\/opportunities/);
  });

  await test("investor CTA is idea-first", () => {
    const landing = read("src/config/public-landing.ts");
    assert.match(landing, /Хочу инвестировать/);
    assert.match(landing, /href: \"\/idea\"/);
  });

  await test("no routes deleted — deep links still referenced", () => {
    assert.ok(operatorSystemNav.some((i) => i.href === "/admin/owner/lia"));
    assert.ok(dashboardNavMore.some((i) => i.href === "/dashboard/needs"));
    assert.ok(partnerNavMore.some((i) => i.href === "/partner/projects"));
  });

  await test("needs UI uses humanNeedStatus", () => {
    const list = read("src/app/(dashboard)/dashboard/needs/page.tsx");
    assert.match(list, /humanNeedStatus/);
    assert.doesNotMatch(list, /\{n\.status\}/);
  });

  console.log(`\nDone: ${passed} passed, ${failed} failed\n`);
  if (failed) process.exit(1);
}

main();
