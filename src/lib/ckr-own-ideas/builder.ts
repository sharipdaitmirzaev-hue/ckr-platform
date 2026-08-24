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
import { money } from "@/lib/ckr-own-ideas/money";
import { rateOwnIdea } from "@/lib/ckr-own-ideas/rating";
import { findMissingResource } from "@/lib/ckr-own-ideas/search";
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
      signal.claimKind === "INFERENCE",
    provenance: {
      kind: signal.claimKind ?? "FACT",
      sourceType: signal.sourceType ?? "unknown",
      sourceUrl: signal.sourceUrl ?? signal.canonicalUrl ?? null,
      sourceLabel: signal.sourceLabel ?? "источник",
      fetchedAt: new Date().toISOString(),
      verifiedAt: null,
      trustLevel: signal.trustLevel ?? "search_snippet",
    },
  };
}

function event(type: OwnIdeaEvent["type"], note: string, at: string): OwnIdeaEvent {
  return { id: randomUUID(), type, at, actor: "system", note };
}

function pairSignals(signals: OwnIdeaSignal[]) {
  const assets = signals.filter((s) => s.kind === "ASSET" || s.kind === "LOCATION");
  const demand = signals.filter((s) => s.kind === "DEMAND" || s.kind === "MARKET");
  const supply = signals.filter((s) => s.kind === "SUPPLY");
  const pairs: OwnIdeaSignal[][] = [];
  for (const a of assets) {
    for (const d of demand) pairs.push([a, d]);
  }
  if (pairs.length === 0) {
    for (const d of demand) {
      for (const s of supply) pairs.push([d, s]);
    }
  }
  return pairs.slice(0, CKR_OWN_IDEAS_BUDGETS.maxInitialIdeas);
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
  const pairs = pairSignals(signals);

  let searches = 0;
  let externalCalls = 0;
  let depth = 0;
  let ideasRejected = 0;
  const generated: CkrOwnIdea[] = [];
  const updated: CkrOwnIdea[] = [];
  let stopReason = "assembled";

  for (const pair of pairs) {
    if (generated.length + updated.length >= CKR_OWN_IDEAS_BUDGETS.maxInitialIdeas) {
      stopReason = "max_ideas";
      break;
    }
    if (searches >= CKR_OWN_IDEAS_BUDGETS.maxSearches) {
      stopReason = "budget_searches";
      break;
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
        if (searches >= CKR_OWN_IDEAS_BUDGETS.maxSearches) break;
        searches += 1;
        if (gap.kind === "CAPITAL") {
          const fin = searchFinancing({
            query: gap.query,
            amountNeeded: found.find((c) => c.amount)?.amount?.amount ?? null,
            internal: input.catalog.internalResources,
            external: input.catalog.externalResources,
          });
          if (fin.searchedExternal) externalCalls += 1;
          if (fin.hit) {
            found.push(signalToComponent(fin.hit.signal, true));
            progressed = true;
          } else {
            missing.push({
              kind: "CAPITAL",
              reason: "Не найдено финансирование",
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
        });
        if (res.searchedExternal) externalCalls += 1;
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
    if (found.some((c) => c.kind === "CAPITAL" && c.found)) {
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
  const metrics: OwnIdeaRunMetrics = {
    runId,
    startedAt,
    finishedAt,
    durationMs: Math.max(
      0,
      new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
    ),
    queries: searches,
    results: signals.length,
    enrichments: Math.min(searches, CKR_OWN_IDEAS_BUDGETS.maxEnrich),
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
    internalSearches: searches,
    externalCalls,
    depthReached: depth,
    stopReason,
    costEstimate: null,
    clientRequestUsed: false,
    autoPublish: false,
    autoOutreach: false,
    matchingEdges: false,
    scheduler: false,
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
    ownerLockedFields: Array.from(
      new Set([...idea.ownerLockedFields, "title", "essence", "economics", "rating"]),
    ),
    updatedAt: at,
    events: [...idea.events, { id: randomUUID(), type: map.type, at, actor: "owner", note: map.note }],
  };
}
