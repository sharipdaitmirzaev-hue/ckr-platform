/**
 * Stage 4Q builder — deterministic pairing + missing-element loop.
 * MANUAL RUN only. No Scheduler. No Matching edges. No auto-publish/outreach.
 */
import { randomUUID } from "node:crypto";
import {
  CKR_OWN_IDEAS_BUDGETS,
  CKR_OWN_IDEAS_FORBIDDEN,
} from "@/config/ckr-own-ideas";
import { computeRoughEconomics, isNegativeEconomics } from "@/lib/ckr-own-ideas/economics";
import { FINANCING_SAFE_WORDING, searchFinancing } from "@/lib/ckr-own-ideas/financing";
import {
  ideaFingerprintFromComponents,
} from "@/lib/ckr-own-ideas/fingerprint";
import { isGenericFinancingPage } from "@/lib/ckr-own-ideas/live-catalog-guards";
import { money } from "@/lib/ckr-own-ideas/money";
import { passesMinIdeaGate } from "@/lib/ckr-own-ideas/quality-gate";
import { rateOwnIdea } from "@/lib/ckr-own-ideas/rating";
import {
  consumeSearch,
  createOwnIdeaRunBudget,
  snapshotBudget,
  type OwnIdeaRunBudget,
} from "@/lib/ckr-own-ideas/run-budget";
import { findMissingResource } from "@/lib/ckr-own-ideas/search";
import { pairFits, signalsFit } from "@/lib/ckr-own-ideas/fit";
import { geoCompatibility } from "@/lib/ckr-own-ideas/quality-gate";
import type {
  CkrOwnIdea,
  OwnIdeaCatalog,
  OwnIdeaComponent,
  OwnIdeaEvent,
  OwnIdeaMissing,
  OwnIdeaRunMetrics,
  OwnIdeaSignal,
} from "@/types/ckr-own-ideas";

export type BuilderInput = {
  catalog: OwnIdeaCatalog;
  existing?: CkrOwnIdea[];
  ownerId?: string;
  marker?: string | null;
  now?: string;
  catalogMode?: OwnIdeaRunMetrics["catalogMode"];
  liveMeta?: {
    queries?: number;
    externalCalls?: number;
    realSignals?: number;
    rejectedSignals?: number;
    catalogSearches?: number;
    catalogExternalCalls?: number;
    discoveryCandidates?: number;
    detailResolutionAttempts?: number;
    officialDetailsResolved?: number;
    aggregatorCandidates?: number;
    aggregatorToOfficialResolved?: number;
    detailValidationRejected?: number;
    liveFacts?: number;
    budgetExhausted?: boolean;
  };
  budget?: OwnIdeaRunBudget;
};

export type BuilderResult = {
  ideas: CkrOwnIdea[];
  metrics: OwnIdeaRunMetrics;
  forbidden: typeof CKR_OWN_IDEAS_FORBIDDEN;
};

function nowIso(now?: string) {
  return now || new Date().toISOString();
}

function signalToComponent(signal: OwnIdeaSignal, found: boolean): OwnIdeaComponent {
  const genericCap =
    signal.kind === "CAPITAL" &&
    isGenericFinancingPage({ url: signal.sourceUrl || signal.canonicalUrl, title: signal.title });
  return {
    id: signal.id,
    kind: signal.kind,
    title: signal.title,
    origin: signal.origin,
    identityKey: signal.identityKey ?? null,
    officialId: signal.officialId ?? null,
    canonicalUrl: signal.canonicalUrl ?? null,
    amount:
      signal.amount != null
        ? money(signal.amount, signal.claimKind ?? "FACT", undefined)
        : null,
    found,
    requiresCheck:
      signal.kind === "CAPITAL" ||
      signal.trustLevel === "general_web" ||
      signal.claimKind === "INFERENCE" ||
      genericCap,
    provenance: {
      kind: genericCap ? "UNKNOWN" : signal.claimKind ?? "FACT",
      sourceType: signal.sourceType ?? "unknown",
      sourceUrl: signal.sourceUrl ?? signal.canonicalUrl ?? null,
      sourceLabel: signal.sourceLabel ?? "источник",
      fetchedAt: signal.fetchedAt ?? new Date().toISOString(),
      verifiedAt: signal.detailResolved && signal.claimKind === "FACT" ? signal.fetchedAt ?? null : null,
      trustLevel: genericCap ? "general_web" : signal.trustLevel ?? "search_snippet",
      fields: signal.factFields,
      sourceDomain: signal.sourceDomain ?? null,
      verificationStatus: signal.verificationStatus,
      confidence: signal.confidence,
    },
    pageType: signal.pageType,
    financeKind: signal.financeKind ?? null,
    financeAvailability: genericCap ? "UNKNOWN" : signal.financeAvailability,
  };
}

function event(type: OwnIdeaEvent["type"], note: string, at: string): OwnIdeaEvent {
  return { id: randomUUID(), type, at, actor: "system", note };
}

function pairScore(anchor: OwnIdeaSignal, other: OwnIdeaSignal): number {
  const geo = geoCompatibility(anchor.geo || anchor.region, other.geo || other.region, {
    explicitCrossRegion: Boolean(anchor.crossRegionJustified || other.crossRegionJustified),
    crossRegionReason: anchor.crossRegionReason || other.crossRegionReason || null,
  });
  if (geo === "SAME_REGION") return 3;
  if (geo === "NEAR_REGION") return 2;
  if (geo === "CROSS_REGION_EXPLICIT") return 1;
  return 0;
}

function bestPartner(anchor: OwnIdeaSignal, pool: OwnIdeaSignal[]): OwnIdeaSignal | null {
  let best: OwnIdeaSignal | null = null;
  let bestScore = -1;
  for (const candidate of pool) {
    if (!signalsFit(anchor, candidate).ok) continue;
    const score = pairScore(anchor, candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

function pairSignals(signals: OwnIdeaSignal[]): {
  pairs: OwnIdeaSignal[][];
  rejected: number;
} {
  const assets = signals.filter((s) => s.kind === "ASSET" || s.kind === "LOCATION");
  const demand = signals.filter((s) => s.kind === "DEMAND" || s.kind === "MARKET");
  const supply = signals.filter((s) => s.kind === "SUPPLY");
  const pairs: OwnIdeaSignal[][] = [];
  const used = new Set<string>();
  let rejected = 0;

  for (const d of demand) {
    if (used.has(d.id)) continue;
    const pool = assets.filter((a) => !used.has(a.id));
    const best = bestPartner(d, pool);
    if (best) {
      pairs.push([best, d]);
      used.add(best.id);
      used.add(d.id);
      rejected += assets.filter((a) => a.id !== best.id && !pairFits([a, d])).length;
    } else if (assets.length) {
      rejected += assets.filter((a) => !pairFits([a, d])).length || 1;
    }
  }

  for (const a of assets.filter((x) => !used.has(x.id))) {
    const pool = demand.filter((d) => !used.has(d.id));
    const best = bestPartner(a, pool);
    if (best) {
      pairs.push([a, best]);
      used.add(a.id);
      used.add(best.id);
    } else if (pool.length) {
      rejected += 1;
    }
  }

  if (pairs.length === 0) {
    for (const d of demand) {
      if (used.has(d.id)) continue;
      const pool = supply.filter((s) => !used.has(s.id));
      const best = bestPartner(d, pool);
      if (best) {
        pairs.push([d, best]);
        used.add(d.id);
        used.add(best.id);
      } else if (pool.length) {
        rejected += 1;
      }
    }
  }

  return {
    pairs: pairs.slice(0, CKR_OWN_IDEAS_BUDGETS.maxInitialIdeas),
    rejected,
  };
}

function neededKinds(found: OwnIdeaComponent[]): Array<{
  kind: OwnIdeaComponent["kind"];
  query: string;
}> {
  const kinds = new Set(found.filter((c) => c.found).map((c) => c.kind));
  const need: Array<{ kind: OwnIdeaComponent["kind"]; query: string }> = [];
  if (kinds.has("ASSET") || kinds.has("LOCATION")) {
    if (!kinds.has("DEMAND") && !kinds.has("MARKET")) {
      need.push({ kind: "DEMAND", query: found.map((c) => c.title).join(" ") });
    }
  }
  if (kinds.has("DEMAND") && !kinds.has("ASSET") && !kinds.has("SUPPLY") && !kinds.has("LOCATION")) {
    need.push({ kind: "SUPPLY", query: found.map((c) => c.title).join(" ") });
  }
  if (!kinds.has("CAPITAL")) {
    need.push({ kind: "CAPITAL", query: "финансирование лизинг кредит инвестор" });
  }
  if ((kinds.has("ASSET") || kinds.has("LOCATION")) && !kinds.has("TEAM")) {
    need.push({ kind: "TEAM", query: "оператор подрядчик компания" });
  }
  return need;
}

function applyRediscovery(existing: CkrOwnIdea, next: CkrOwnIdea): CkrOwnIdea {
  const locked = new Set(existing.ownerLockedFields);
  return {
    ...existing,
    components: next.components,
    missing: next.missing,
    economics: locked.has("economics") ? existing.economics : next.economics,
    rating: locked.has("rating") ? existing.rating : next.rating,
    title: locked.has("title") ? existing.title : next.title,
    essence: locked.has("essence") ? existing.essence : next.essence,
    ownerState: existing.ownerState,
    projectId: existing.projectId,
    updatedAt: next.updatedAt,
    events: [
      ...existing.events,
      event("rediscovery_updated", "Новые FACT, правки владельца сохранены", next.updatedAt),
    ],
  };
}

export function runOwnIdeaBuilder(input: BuilderInput): BuilderResult {
  const startedAt = nowIso(input.now);
  const runId = randomUUID();
  const existing = input.existing ?? [];
  const signals = input.catalog.signals.slice(0, CKR_OWN_IDEAS_BUDGETS.maxSignalsPerRun);
  const { pairs, rejected: pairsRejected } = pairSignals(signals);
  const budget = input.budget ?? createOwnIdeaRunBudget();

  let ideasRejected = 0;
  const generated: CkrOwnIdea[] = [];
  const updated: CkrOwnIdea[] = [];
  let stopReason = "assembled";
  let depth = 0;

  for (const pair of pairs) {
    if (generated.length + updated.length >= CKR_OWN_IDEAS_BUDGETS.maxInitialIdeas) {
      stopReason = "max_ideas";
      break;
    }

    const gate = passesMinIdeaGate(pair);
    if (!gate.ok) {
      ideasRejected += 1;
      continue;
    }

    const found = pair.map((s) => signalToComponent(s, true));
    const missing: OwnIdeaMissing[] = [];
    depth = 0;

    while (depth < CKR_OWN_IDEAS_BUDGETS.maxDepth) {
      const gaps = neededKinds(found).filter(
        (g) => !found.some((c) => c.kind === g.kind && c.found),
      );
      if (gaps.length === 0) break;
      depth += 1;
      let progressed = false;
      for (const gap of gaps) {
        if (!consumeSearch(budget, "builder")) {
          stopReason = "budget_searches";
          break;
        }
        if (gap.kind === "CAPITAL") {
          const fin = searchFinancing({
            query: gap.query,
            amountNeeded: found.find((c) => c.amount)?.amount?.amount ?? null,
            internal: input.catalog.internalResources,
            external: input.catalog.externalResources,
            context: pair,
          });
          const hit = fin.hit?.signal;
          const generic =
            hit &&
            isGenericFinancingPage({
              url: hit.sourceUrl || hit.canonicalUrl,
              title: hit.title,
            });
          if (hit && !generic) {
            found.push(signalToComponent(hit, true));
            progressed = true;
          } else {
            missing.push({
              kind: "CAPITAL",
              reason: generic
                ? "Generic bank landing — financeAvailability=UNKNOWN"
                : "Не найдено финансирование",
              searchedInternal: fin.searchedInternal,
              searchedExternal: fin.searchedExternal,
            });
          }
          continue;
        }
        const res = findMissingResource({
          kind: gap.kind,
          query: gap.query,
          internal: input.catalog.internalResources,
          external: input.catalog.externalResources,
          context: pair,
        });
        if (res.hit) {
          found.push(signalToComponent(res.hit.signal, true));
          progressed = true;
        } else {
          missing.push({
            kind: gap.kind,
            reason:
              gap.kind === "TEAM"
                ? "Не найден оператор / подрядчик"
                : gap.kind === "SUPPLY"
                  ? "Не найден поставщик внутри ЦКР, внешний поиск без результата"
                  : `Не найден элемент ${gap.kind}`,
            searchedInternal: res.searchedInternal,
            searchedExternal: res.searchedExternal,
          });
        }
      }
      if (!progressed) {
        stopReason = "no_improvement";
        break;
      }
    }

    const uniqueMissing: OwnIdeaMissing[] = [];
    for (const m of missing) {
      if (!uniqueMissing.some((x) => x.kind === m.kind && x.reason === m.reason)) {
        uniqueMissing.push(m);
      }
    }
    missing.length = 0;
    missing.push(...uniqueMissing);

    const economics = computeRoughEconomics(found);
    const rating = rateOwnIdea({ components: found, missing, economics });
    if (isNegativeEconomics(economics)) ideasRejected += 1;

    const at = nowIso(input.now);
    const fingerprint = ideaFingerprintFromComponents(
      found.filter((c) =>
        ["ASSET", "DEMAND", "LOCATION", "MARKET"].includes(c.kind),
      ),
    );
    const title = found.map((c) => c.title).slice(0, 2).join(" + ");
    const events: OwnIdeaEvent[] = [
      event("idea_created", "Собственная идея ЦКР собрана из сигналов", at),
      ...found.map((c) => event("signal_added", c.title, at)),
      ...missing.map((m) => event("resource_missing", m.reason, at)),
      event("economics_updated", economics.disclaimer, at),
    ];
    if (found.some((c) => c.kind === "CAPITAL" && c.found && c.financeAvailability !== "UNKNOWN")) {
      events.push(event("resource_found", FINANCING_SAFE_WORDING, at));
    }

    const idea: CkrOwnIdea = {
      id: randomUUID(),
      title,
      essence: `Связка: ${title}`,
      whyNoticed: "ЦКР собрал рыночные сигналы без входящей заявки клиента",
      rating,
      ownerState: "REVIEW",
      visibility: "OWNER_ONLY",
      components: found,
      missing,
      economics,
      risks: [
        ...(missing.map((m) => m.reason) || []),
        "Юридическая и фактическая реализуемость требует проверки",
        economics.disclaimer,
      ],
      nextChecks: [
        ...missing.map((m) => m.reason),
        ...found.filter((c) => c.requiresCheck).map((c) => `Проверить: ${c.title}`),
      ],
      fingerprint,
      ownerLockedFields: [],
      projectId: null,
      runId,
      marker: input.marker ?? null,
      createdAt: at,
      updatedAt: at,
      events,
    };

    const prev = existing.find((e) => e.fingerprint === fingerprint);
    if (prev) {
      updated.push(applyRediscovery(prev, idea));
    } else {
      generated.push(idea);
    }
  }

  const finishedAt = nowIso(input.now);
  const snap = snapshotBudget(budget);
  const catalogSearches = input.liveMeta?.catalogSearches ?? snap.catalogSearches;
  const catalogExternalCalls = input.liveMeta?.catalogExternalCalls ?? snap.catalogExternalCalls;
  const metrics: OwnIdeaRunMetrics = {
    runId,
    startedAt,
    finishedAt,
    durationMs: Math.max(
      0,
      new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
    ),
    queries: catalogSearches + snap.builderSearches,
    results: signals.length,
    enrichments: Math.min(snap.builderSearches, CKR_OWN_IDEAS_BUDGETS.maxEnrich),
    sources: [
      ...new Set(
        [...input.catalog.signals, ...input.catalog.internalResources, ...input.catalog.externalResources]
          .map((s) => s.sourceLabel || s.sourceType || "unknown")
          .filter(Boolean) as string[],
      ),
    ],
    ideasGenerated: generated.length,
    ideasRejected,
    ideasUpdated: updated.length,
    internalSearches: snap.builderSearches,
    externalCalls: catalogExternalCalls + snap.builderExternalCalls,
    catalogSearches,
    builderSearches: snap.builderSearches,
    catalogExternalCalls,
    builderExternalCalls: snap.builderExternalCalls,
    totalExternalCalls: catalogExternalCalls + snap.builderExternalCalls,
    depthReached: depth,
    stopReason: pairs.length === 0 && signals.length > 0 ? "no_compatible_pairs" : stopReason,
    costEstimate: null,
    clientRequestUsed: false,
    autoPublish: false,
    autoOutreach: false,
    matchingEdges: false,
    scheduler: false,
    catalogMode: input.catalogMode ?? "fixture",
    pairsRejected,
    realSignals: input.liveMeta?.realSignals,
    rejectedSignals: input.liveMeta?.rejectedSignals,
    discoveryCandidates: input.liveMeta?.discoveryCandidates,
    detailResolutionAttempts: input.liveMeta?.detailResolutionAttempts,
    officialDetailsResolved: input.liveMeta?.officialDetailsResolved,
    aggregatorCandidates: input.liveMeta?.aggregatorCandidates,
    aggregatorToOfficialResolved: input.liveMeta?.aggregatorToOfficialResolved,
    detailValidationRejected: input.liveMeta?.detailValidationRejected,
    liveFacts: input.liveMeta?.liveFacts,
    budgetExhausted: input.liveMeta?.budgetExhausted,
  };

  return {
    ideas: [...updated, ...generated],
    metrics,
    forbidden: CKR_OWN_IDEAS_FORBIDDEN,
  };
}

export function applyOwnerAction(
  idea: CkrOwnIdea,
  action: "accept" | "reject" | "defer" | "research" | "refine" | "create_project",
  projectId?: string | null,
): CkrOwnIdea {
  const at = new Date().toISOString();
  const map = {
    accept: { state: "ACCEPTED" as const, type: "owner_accepted" as const, note: "OWNER принял в работу" },
    reject: { state: "REJECTED" as const, type: "owner_rejected" as const, note: "OWNER отклонил" },
    defer: { state: "DEFERRED" as const, type: "owner_deferred" as const, note: "OWNER отложил" },
    research: {
      state: "RESEARCH" as const,
      type: "owner_requested_research" as const,
      note: "OWNER попросил продолжить поиск",
    },
    refine: {
      state: "RESEARCH" as const,
      type: "owner_asked_refine" as const,
      note: "OWNER запросил уточнить расчёт",
    },
    create_project: {
      state: "PROJECT_CREATED" as const,
      type: "owner_created_project" as const,
      note: "OWNER создал проект. Идея не публиковалась автоматически.",
    },
  }[action];
  return {
    ...idea,
    ownerState: map.state,
    projectId: action === "create_project" ? projectId ?? idea.projectId : idea.projectId,
    ownerLockedFields: Array.from(new Set([...idea.ownerLockedFields, "title", "essence"])),
    updatedAt: at,
    events: [...idea.events, { id: randomUUID(), type: map.type, at, actor: "owner", note: map.note }],
  };
}
