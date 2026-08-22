/**
 * Stage 4F — Company Intelligence tests.
 * Run: npx tsx scripts/test-company-intelligence-stage4f.ts
 */
process.env.LIA_OI_STORE = "memory";
process.env.BUSINESS_GRAPH_STORE = "memory";
process.env.NEED_PROFILE_STORE = process.env.NEED_PROFILE_STORE || "memory";

import assert from "node:assert/strict";
import {
  buildCompanyIntelligenceCard,
  organizationNeeds,
} from "../src/lib/company-intelligence/card";
import {
  filterOrganizationsCatalog,
  countOrganizationsByRegion,
} from "../src/lib/company-intelligence/catalog";
import {
  findCompanyDuplicate,
  normalizeInn,
  domainFromWebsite,
} from "../src/lib/company-intelligence/duplicates";
import { resolveViewerRole, canSeeTier, toPublicOrganizationFields } from "../src/lib/company-intelligence/privacy";
import { computeCompanyQuality } from "../src/lib/company-intelligence/quality";
import { buildCompanyTimeline } from "../src/lib/company-intelligence/timeline";
import { buildLiaCompanyEnrichmentDraft } from "../src/lib/company-intelligence/lia-enrich-draft";
import { listDagestanSeedCandidates } from "../src/lib/company-intelligence/seed-candidates";
import { getCompanyFeed } from "../src/lib/company-intelligence/feed";
import { organizationToNodeInput } from "../src/lib/business-graph/bridge";
import { createMemoryBusinessGraphService } from "../src/lib/business-graph/service";
import { createMemoryPersonalizedFeedService } from "../src/lib/personalized-feed/service";
import { mapOrganizationRow } from "../src/lib/partners/mappers";
import type { Organization } from "../src/types";
import type { NeedProfile } from "../src/types/need-profile";

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

function org(partial: Partial<Organization> = {}): Organization {
  return {
    id: partial.id || "org_1",
    name: partial.name || "ООО Вода Дагестан",
    type: partial.type || "company",
    description: partial.description || "Производитель воды",
    website: partial.website || "https://water-dag.example",
    region: partial.region || "Дагестан",
    city: partial.city || "Махачкала",
    verificationStatus: partial.verificationStatus || "verified",
    createdBy: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
    legalName: partial.legalName ?? "ООО Вода Дагестан",
    inn: partial.inn ?? "0500000000",
    ogrn: partial.ogrn ?? "",
    legalForm: partial.legalForm ?? "ООО",
    industry: partial.industry ?? "beverage",
    subindustry: partial.subindustry ?? "",
    publicEmail: partial.publicEmail ?? "",
    publicPhone: partial.publicPhone ?? "",
    productsServices: partial.productsServices ?? "питьевая вода",
    offersSummary: partial.offersSummary ?? "поставки воды и напитков",
    seeksSummary: partial.seeksSummary ?? "покупатели, дистрибьюторы",
    sourceUrl: partial.sourceUrl ?? "https://water-dag.example/about",
    sourceLabel: partial.sourceLabel ?? "official site",
    ownerNotes: partial.ownerNotes ?? "secret note",
    liaEnrichmentDraft: partial.liaEnrichmentDraft ?? null,
    isListed: partial.isListed !== false,
  };
}

function need(partial: Partial<NeedProfile> = {}): NeedProfile {
  return {
    id: partial.id || "need_1",
    intentType: (partial.intentType as NeedProfile["intentType"]) || "SEEK_BUYER",
    title: partial.title || "Ищем покупателей воды",
    description: partial.description || "",
    ownerType: partial.ownerType || "organization",
    ownerId: partial.ownerId || "org_1",
    status: partial.status || "ACTIVE",
    budgetMin: null,
    budgetMax: null,
    currency: "RUB",
    regions: partial.regions || ["Дагестан"],
    industries: partial.industries || ["beverage"],
    keywords: [],
    criteria: {},
    visibility: "CKR_ONLY",
    priority: "NORMAL",
    timeHorizon: null,
    riskPreference: null,
    matchingEnabled: true,
    lastMatchedAt: null,
    contextGroupId: null,
    fingerprint: partial.fingerprint || "fp_need_1",
    source: "manual",
    createdBy: "user_1",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  };
}

async function main() {
  console.log("\nStage 4F — Company Intelligence\n");

  await test("mapper includes Stage 4F fields", () => {
    const mapped = mapOrganizationRow({
      id: "x",
      name: "A",
      type: "company",
      description: "",
      website: "",
      region: "Дагестан",
      city: "",
      verification_status: "verified",
      created_by: null,
      created_at: "t",
      updated_at: "t",
      inn: "0500000001",
      offers_summary: "вода",
      seeks_summary: "покупатели",
      is_listed: true,
    });
    assert.equal(mapped.inn, "0500000001");
    assert.equal(mapped.offersSummary, "вода");
    assert.equal(mapped.seeksSummary, "покупатели");
  });

  await test("legal identity / inn normalize", () => {
    assert.equal(normalizeInn("05 00 000000"), "0500000000");
    assert.equal(normalizeInn("123"), null);
    assert.equal(domainFromWebsite("https://www.Example.com/a"), "example.com");
  });

  await test("duplicate prevention inn/ogrn stronger than name", () => {
    const existing = [org({ id: "a", inn: "0500000000", name: "Other" })];
    const byInn = findCompanyDuplicate(
      { id: "", name: "Completely Different", inn: "0500000000", ogrn: "", website: "" },
      existing,
    );
    assert.equal(byInn.kind, "inn");
    assert.equal(byInn.canAutoMerge, true);

    const byNameOnly = findCompanyDuplicate(
      {
        id: "",
        name: "ООО Вода Дагестан",
        inn: "",
        ogrn: "",
        website: "https://other.example",
      },
      existing,
    );
    assert.equal(byNameOnly.kind, "none");
  });

  await test("public/private visibility", () => {
    assert.equal(resolveViewerRole({}), "anon");
    assert.equal(resolveViewerRole({ isAdmin: true }), "admin");
    assert.ok(canSeeTier("anon", "PUBLIC"));
    assert.ok(!canSeeTier("anon", "OWNER_ONLY"));
    assert.ok(canSeeTier("owner_manager", "OWNER_ONLY"));
    const pub = toPublicOrganizationFields(org());
    assert.equal(pub.inn, "0500000000");
    assert.ok(!("ownerNotes" in pub));
  });

  await test("company card + quality + timeline", () => {
    const card = buildCompanyIntelligenceCard({
      organization: org(),
      viewerRole: "owner_manager",
      linked: {
        needs: [need()],
        projects: [{ id: "p1", title: "Завод" }],
        opportunities: [],
        investments: [],
        members: [],
        graphEdges: [{ id: "e1", relationshipType: "OPERATES", direction: "out", otherTitle: "Завод" }],
      },
      demandSignals: { confirmedDemand: 3, potentialBuyer: 2 },
    });
    assert.equal(card.publicView.name, "ООО Вода Дагестан");
    assert.ok(card.internal);
    assert.ok(card.internal!.quality.legalIdentityKnown);
    assert.ok(card.internal!.quality.hasActiveNeeds);
    assert.match(card.internal!.demandSignals.noteRu, /confirmed demand/i);
    assert.ok(card.timeline.length >= 2);
    assert.ok(card.sections.includes("Что предлагает"));
    assert.equal(card.internal!.ownerNotes, "secret note");

    const anon = buildCompanyIntelligenceCard({
      organization: org(),
      viewerRole: "anon",
    });
    assert.equal(anon.internal, undefined);
  });

  await test("organization needs filter", () => {
    const list = organizationNeeds("org_1", [
      need({ id: "n1", ownerId: "org_1" }),
      need({ id: "n2", ownerId: "org_2" }),
      need({ id: "n3", ownerType: "user", ownerId: "u1" }),
    ]);
    assert.equal(list.length, 1);
  });

  await test("Graph bridge organization → COMPANY", async () => {
    const input = organizationToNodeInput({
      id: "org_g",
      name: "Test Co",
      inn: "0500000002",
      region: "Дагестан",
      website: "https://t.example",
    });
    assert.equal(input.nodeType, "COMPANY");
    assert.equal(input.internalEntityType, "organizations");
    assert.equal(input.structuredData?.inn, "0500000002");
    const graph = createMemoryBusinessGraphService();
    const node = await graph.bridgeFromOrganization({
      id: "org_g",
      name: "Test Co",
      inn: "0500000002",
      region: "Дагестан",
    });
    assert.equal(node.nodeType, "COMPANY");
    const edges = await graph.getEdges({ nodeId: node.id });
    assert.ok(!edges.some((e) => e.relationshipType === "MATCHES"));
  });

  await test("LIA enrichment draft no auto-publish", () => {
    const draft = buildLiaCompanyEnrichmentDraft(org({ inn: "" }));
    assert.equal(draft.autoPublish, false);
    assert.equal(draft.status, "DRAFT");
    assert.ok(draft.queries.length >= 2);
    assert.ok(draft.findings.some((f) => f.field === "inn" && f.value === "UNKNOWN"));
  });

  await test("regional filters + seed inventory", () => {
    const list = filterOrganizationsCatalog(
      [
        org({ id: "1", region: "Дагестан", industry: "beverage", verificationStatus: "verified" }),
        org({ id: "2", region: "Москва", industry: "beverage", verificationStatus: "verified" }),
        org({ id: "3", region: "Дагестан", verificationStatus: "unverified" }),
      ],
      { region: "Дагестан", industry: "beverage" },
    );
    assert.equal(list.length, 1);
    assert.equal(countOrganizationsByRegion([org()], "Дагестан"), 1);
    const seeds = listDagestanSeedCandidates();
    assert.ok(seeds.length >= 10);
    assert.ok(seeds.every((s) => s.sourceUrl.startsWith("http")));
  });

  await test("company quality not credit score", () => {
    const q = computeCompanyQuality({
      organization: org({
        inn: "",
        ogrn: "",
        legalName: "",
        website: "",
        region: "",
        industry: "",
        offersSummary: "",
        sourceUrl: "",
        sourceLabel: "",
        verificationStatus: "unverified",
      }),
      activeNeedsCount: 0,
      publicOffersCount: 0,
      graphLinksCount: 0,
    });
    assert.ok(q.score < 40);
    assert.ok(!q.legalIdentityKnown);
  });

  await test("company feed uses need profiles (empty ok)", async () => {
    const feed = createMemoryPersonalizedFeedService();
    const bundle = await getCompanyFeed({
      organizationId: "org_1",
      ownerUserId: "user_1",
      needs: [need({ intentType: "SEEK_BUYER" })],
      feed,
    });
    assert.equal(bundle.organizationId, "org_1");
    assert.equal(bundle.needsUsed.length, 1);
    assert.ok(Array.isArray(bundle.recommendations));
  });

  await test("timeline visibility filters OWNER_ONLY for anon", () => {
    const items = buildCompanyTimeline({
      organization: org(),
      viewer: "anon",
      events: [
        {
          id: "e1",
          title: "secret",
          visibility: "OWNER_ONLY",
          created_at: "2026-08-11T00:00:00.000Z",
        },
      ],
    });
    assert.ok(!items.some((i) => i.visibility === "OWNER_ONLY"));
  });

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
