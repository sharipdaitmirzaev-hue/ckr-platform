/**
 * Map domain ↔ DB rows for lia_oi_* tables.
 */

import type {
  LiaOiAssignment,
  LiaOiAssignmentStatus,
  LiaOiCandidate,
  LiaOiFeedback,
  LiaOiHypothesis,
  LiaOiOpportunityChange,
  LiaOiOpportunityEvent,
  LiaOiReport,
  LiaOiSearchRequest,
  LiaOiSourceRef,
} from "@/types/lia-oi";

export type OppRow = Record<string, unknown>;

export function candidateToRow(c: LiaOiCandidate): OppRow {
  return {
    id: c.id,
    search_run_id: c.searchRequestId ?? null,
    type: c.type,
    title: c.title,
    description: c.description,
    summary: c.summary,
    why_interesting: c.whyInteresting,
    recommendation: c.recommendation,
    next_step: c.nextStep,
    status: c.status,
    country: c.country,
    region: c.region ?? null,
    city: c.city ?? null,
    industry: c.industry ?? null,
    subindustry: c.subindustry ?? null,
    asking_price: c.askingPrice ?? null,
    investment_required: c.investmentRequired ?? null,
    revenue: c.revenue ?? null,
    profit: c.profit ?? null,
    payback_period: c.paybackPeriod ?? null,
    asset_type: c.assetType ?? null,
    area: c.area ?? null,
    land_area: c.landArea ?? null,
    contact_name: c.contactName ?? null,
    contact_phone: c.contactPhone ?? null,
    contact_email: c.contactEmail ?? null,
    contacts_public: c.contactsPublic ?? null,
    score_overall: c.score.overall,
    score_confidence: c.score.confidence,
    score_relevance: c.score.relevance,
    score_quality: c.score.quality,
    score_opportunity: c.score.opportunity,
    score_priority: c.score.priority,
    score_breakdown: c.score.breakdown,
    score_explanation: c.score.explanation,
    why_top: c.score.whyTop ?? [],
    claims: c.claims,
    risks: c.risks,
    unknowns: c.unknowns,
    to_verify: c.toVerify,
    match_hints: c.matchHints,
    canonical_key: c.canonicalKey,
    fingerprint: c.fingerprint ?? c.canonicalKey,
    canonical_url: c.canonicalUrl ?? null,
    source_object_id: c.sourceObjectId ?? null,
    raw_stub_ids: c.rawStubIds,
    page_type: c.pageType,
    content_intent: c.contentIntent ?? "UNKNOWN",
    is_catalog_source: c.isCatalogSource,
    result_bucket: c.resultBucket ?? null,
    reject_reason: c.rejectReason ?? null,
    budget_fit: c.budgetFit ?? "UNKNOWN",
    price_status: c.priceStatus ?? "UNKNOWN",
    price_kind: c.priceKind ?? "UNKNOWN",
    detail_confidence: c.detailConfidence ?? 0,
    detail_signals: c.detailSignals ?? [],
    missing_fields: c.missingFields ?? [],
    why_recommend: c.whyRecommend ?? [],
    is_stub: c.isStub,
    enriched_from_fetch: c.enrichedFromFetch ?? false,
    owner_locked: c.ownerLocked ?? false,
    owner_status_set_at: c.ownerStatusSetAt ?? null,
    owner_status_set_by: c.ownerStatusSetBy ?? null,
    source_class: c.sourceClass ?? null,
    first_seen_at: c.firstSeenAt,
    last_seen_at: c.lastSeenAt,
    opportunity_type: c.opportunityType ?? "WEB_LISTING",
    source_adapter_id: c.sourceAdapterId ?? "serper_general",
    source_confidence: c.sourceConfidence ?? c.score.confidence ?? null,
    is_official_source: c.isOfficialSource ?? false,
    deadline_at: c.deadlineAt ?? null,
    days_remaining: c.daysRemaining ?? null,
    discovery_json: {},
    normalized_json: {
      // retention: compact meta only — no HTML
      sourceCount: c.sources.length,
      hasContacts: Boolean(c.contactPhone || c.contactEmail),
    },
    updated_at: new Date().toISOString(),
  };
}

export function rowToCandidate(
  row: OppRow,
  sources: LiaOiSourceRef[] = [],
): LiaOiCandidate {
  return {
    id: String(row.id),
    type: String(row.type ?? "web_opportunity"),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    summary: String(row.summary ?? ""),
    whyInteresting: (row.why_interesting as string[]) ?? [],
    recommendation: String(row.recommendation ?? ""),
    nextStep: String(row.next_step ?? ""),
    status: row.status as LiaOiCandidate["status"],
    country: String(row.country ?? "RU"),
    region: (row.region as string) ?? undefined,
    city: (row.city as string) ?? undefined,
    industry: (row.industry as string) ?? undefined,
    subindustry: (row.subindustry as string) ?? undefined,
    askingPrice: (row.asking_price as number) ?? null,
    investmentRequired: (row.investment_required as number) ?? null,
    revenue: (row.revenue as number) ?? null,
    profit: (row.profit as number) ?? null,
    paybackPeriod: (row.payback_period as string) ?? null,
    assetType: (row.asset_type as string) ?? undefined,
    area: (row.area as string) ?? undefined,
    landArea: (row.land_area as string) ?? undefined,
    contactName: (row.contact_name as string) ?? undefined,
    contactPhone: (row.contact_phone as string) ?? undefined,
    contactEmail: (row.contact_email as string) ?? undefined,
    contactsPublic: (row.contacts_public as string) ?? undefined,
    sources,
    claims: (row.claims as LiaOiCandidate["claims"]) ?? [],
    risks: (row.risks as string[]) ?? [],
    unknowns: (row.unknowns as string[]) ?? [],
    toVerify: (row.to_verify as string[]) ?? [],
    score: {
      overall: Number(row.score_overall ?? 0),
      confidence: Number(row.score_confidence ?? 0),
      relevance: Number(row.score_relevance ?? 0),
      quality: Number(row.score_quality ?? 0),
      opportunity: Number(row.score_opportunity ?? 0),
      breakdown: (row.score_breakdown as LiaOiCandidate["score"]["breakdown"]) ?? {
        market: 0,
        economics: 0,
        location: 0,
        demand: 0,
        competition: 0,
        execution: 0,
        legal: 0,
        sourceConfidence: 0,
        dataCompleteness: 0,
        strategicFit: 0,
      },
      explanation: (row.score_explanation as string[]) ?? [],
      whyTop: (row.why_top as string[]) ?? [],
      priority: (row.score_priority as LiaOiCandidate["score"]["priority"]) ?? "NORMAL",
    },
    matchHints: (row.match_hints as string[]) ?? [],
    firstSeenAt: String(row.first_seen_at),
    lastSeenAt: String(row.last_seen_at),
    canonicalKey: String(row.canonical_key ?? ""),
    fingerprint: (row.fingerprint as string) ?? undefined,
    canonicalUrl: (row.canonical_url as string) ?? undefined,
    sourceObjectId: (row.source_object_id as string) ?? null,
    rawStubIds: (row.raw_stub_ids as string[]) ?? [],
    isStub: Boolean(row.is_stub),
    searchRequestId: (row.search_run_id as string) ?? undefined,
    pageType: (row.page_type as LiaOiCandidate["pageType"]) ?? "UNKNOWN",
    isCatalogSource: Boolean(row.is_catalog_source),
    enrichedFromFetch: Boolean(row.enriched_from_fetch),
    contentIntent: row.content_intent as LiaOiCandidate["contentIntent"],
    budgetFit: row.budget_fit as LiaOiCandidate["budgetFit"],
    priceStatus: row.price_status as LiaOiCandidate["priceStatus"],
    priceKind: row.price_kind as LiaOiCandidate["priceKind"],
    detailConfidence: Number(row.detail_confidence ?? 0),
    detailSignals: (row.detail_signals as string[]) ?? [],
    missingFields: (row.missing_fields as string[]) ?? [],
    whyRecommend: (row.why_recommend as string[]) ?? [],
    resultBucket: row.result_bucket as LiaOiCandidate["resultBucket"],
    rejectReason: (row.reject_reason as string) ?? undefined,
    sourceClass: row.source_class as LiaOiCandidate["sourceClass"],
    ownerLocked: Boolean(row.owner_locked),
    ownerStatusSetAt: (row.owner_status_set_at as string) ?? undefined,
    ownerStatusSetBy: (row.owner_status_set_by as string) ?? undefined,
    opportunityType: (row.opportunity_type as LiaOiCandidate["opportunityType"]) ??
      "WEB_LISTING",
    sourceAdapterId: (row.source_adapter_id as string) ?? "serper_general",
    sourceConfidence:
      row.source_confidence != null
        ? Number(row.source_confidence)
        : undefined,
    isOfficialSource: Boolean(row.is_official_source),
    deadlineAt: (row.deadline_at as string) ?? null,
    daysRemaining:
      row.days_remaining != null ? Number(row.days_remaining) : null,
  };
}

export function searchRequestToRow(req: LiaOiSearchRequest): OppRow {
  return {
    id: req.id,
    query: req.query,
    intent: req.plan.intent,
    country: req.plan.country,
    regions: req.plan.regions,
    budget_min: req.plan.budgetMin ?? null,
    budget_max: req.plan.budgetMax ?? null,
    plan_json: req.plan,
    candidate_ids: req.candidateIds,
    stub_mode: req.stubMode,
    search_mode: req.searchMode,
    provider_label: req.providerLabel ?? null,
    stats_json: req.stats ?? {},
    duration_ms: req.durationMs ?? null,
    error_summary: req.errorSummary ?? null,
    queries_run: req.stats?.queriesRun ?? 0,
    signals_raw: req.stats?.signalsRaw ?? 0,
    top_count: req.stats?.topOpportunities ?? 0,
    rejected_count: req.stats?.rejected ?? 0,
    created_by: req.createdBy?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
      ? req.createdBy
      : null,
    created_at: req.createdAt,
  };
}

export function rowToSearchRequest(row: OppRow): LiaOiSearchRequest {
  const plan = (row.plan_json as LiaOiSearchRequest["plan"]) ?? {
    id: String(row.id),
    rawQuery: String(row.query),
    intent: row.intent as LiaOiSearchRequest["plan"]["intent"],
    country: String(row.country ?? "RU"),
    regions: (row.regions as string[]) ?? [],
    budgetMin: (row.budget_min as number) ?? null,
    budgetMax: (row.budget_max as number) ?? null,
    industries: ["ANY"],
    assetTypes: [],
    hypotheses: [],
    queries: [],
    createdAt: String(row.created_at),
  };
  return {
    id: String(row.id),
    query: String(row.query),
    plan,
    createdAt: String(row.created_at),
    createdBy: String(row.created_by ?? "system"),
    candidateIds: (row.candidate_ids as string[]) ?? [],
    stubMode: Boolean(row.stub_mode),
    searchMode: (row.search_mode as "stub" | "live") ?? "stub",
    providerLabel: (row.provider_label as string) ?? undefined,
    stats: (row.stats_json as LiaOiSearchRequest["stats"]) ?? undefined,
    durationMs: (row.duration_ms as number) ?? undefined,
    errorSummary: (row.error_summary as string) ?? null,
  };
}

export function sourceToRow(s: LiaOiSourceRef, opportunityId: string): OppRow {
  return {
    id: s.id,
    opportunity_id: opportunityId,
    category: s.category ?? "WEB",
    name: s.name ?? "",
    url: s.url,
    published_at: s.publishedAt ?? null,
    discovered_at: s.discoveredAt ?? null,
    // PostgREST sends JSON null when undefined — NOT NULL DEFAULT would not apply
    is_stub: s.isStub ?? false,
    retrieved_at: s.discoveredAt ?? new Date().toISOString(),
    canonical_url: s.url,
    snippet: null,
    fetch_status: null,
    meta_json: {},
  };
}

export function rowToSource(row: OppRow): LiaOiSourceRef {
  return {
    id: String(row.id),
    category: row.category as LiaOiSourceRef["category"],
    name: String(row.name ?? ""),
    url: String(row.url),
    publishedAt: (row.published_at as string) ?? undefined,
    discoveredAt: (row.discovered_at as string) ?? undefined,
    isStub: Boolean(row.is_stub),
  };
}

export function feedbackToRow(f: LiaOiFeedback): OppRow {
  return {
    id: f.id,
    opportunity_id: f.candidateId,
    actor_user_id: f.createdBy?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
      ? f.createdBy
      : null,
    event: f.event,
    reason: f.reason ?? null,
    created_at: f.createdAt,
    meta_json: {},
  };
}

export function rowToFeedback(row: OppRow): LiaOiFeedback {
  return {
    id: String(row.id),
    candidateId: String(row.opportunity_id),
    event: row.event as LiaOiFeedback["event"],
    reason: (row.reason as string) ?? undefined,
    createdAt: String(row.created_at),
    createdBy: String(row.actor_user_id ?? "system"),
  };
}

export function assignmentToRow(a: LiaOiAssignment): OppRow {
  return {
    id: a.id,
    opportunity_id: a.candidateId,
    kind: a.kind,
    instruction: a.instruction,
    status: a.status,
    result_summary: a.resultSummary,
    created_by: a.createdBy?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
      ? a.createdBy
      : null,
    created_at: a.createdAt,
    updated_at: new Date().toISOString(),
    completed_at: a.completedAt ?? null,
    error_summary: a.errorSummary ?? null,
  };
}

export function rowToAssignment(row: OppRow): LiaOiAssignment {
  const raw = String(row.status ?? "PENDING");
  const status = (
    raw === "done" || raw === "DONE"
      ? "COMPLETED"
      : raw === "queued" || raw === "OPEN"
        ? "PENDING"
        : raw
  ) as LiaOiAssignmentStatus;
  return {
    id: String(row.id),
    candidateId: String(row.opportunity_id),
    kind: row.kind as LiaOiAssignment["kind"],
    instruction: String(row.instruction ?? ""),
    status,
    resultSummary: String(row.result_summary ?? ""),
    createdAt: String(row.created_at),
    completedAt: (row.completed_at as string) ?? undefined,
    createdBy: String(row.created_by ?? "system"),
    errorSummary: (row.error_summary as string) ?? null,
  };
}

export function reportToRow(r: LiaOiReport & { searchRunId?: string; createdBy?: string }): OppRow {
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    body: r.body,
    stats: r.stats,
    candidate_ids: r.candidateIds,
    stub_mode: r.stubMode,
    created_at: r.createdAt,
    search_run_id: r.searchRunId ?? null,
    created_by: r.createdBy ?? null,
  };
}

export function rowToReport(row: OppRow): LiaOiReport {
  return {
    id: String(row.id),
    kind: row.kind as LiaOiReport["kind"],
    title: String(row.title),
    body: String(row.body ?? ""),
    stats: (row.stats as Record<string, number>) ?? {},
    candidateIds: (row.candidate_ids as string[]) ?? [],
    createdAt: String(row.created_at),
    stubMode: Boolean(row.stub_mode),
  };
}

export function hypothesisToRow(h: LiaOiHypothesis): OppRow {
  return {
    id: h.id,
    title: h.title,
    summary: h.summary,
    supporting_candidate_ids: h.supportingCandidateIds,
    missing_pieces: h.missingPieces,
    investment_scale: h.investmentScale ?? null,
    status: h.status,
    created_at: h.createdAt,
  };
}

export function rowToHypothesis(row: OppRow): LiaOiHypothesis {
  return {
    id: String(row.id),
    title: String(row.title),
    summary: String(row.summary ?? ""),
    supportingCandidateIds: (row.supporting_candidate_ids as string[]) ?? [],
    missingPieces: (row.missing_pieces as string[]) ?? [],
    investmentScale: (row.investment_scale as string) ?? undefined,
    createdAt: String(row.created_at),
    status: "DRAFT",
  };
}

export function rowToChange(row: OppRow): LiaOiOpportunityChange {
  return {
    id: String(row.id),
    opportunityId: String(row.opportunity_id),
    fieldName: String(row.field_name),
    oldValue: (row.old_value as string) ?? null,
    newValue: (row.new_value as string) ?? null,
    changeKind: row.change_kind as LiaOiOpportunityChange["changeKind"],
    sourceRunId: (row.source_run_id as string) ?? null,
    createdAt: String(row.created_at),
  };
}

export function rowToEvent(row: OppRow): LiaOiOpportunityEvent {
  return {
    id: String(row.id),
    opportunityId: String(row.opportunity_id),
    eventType: String(row.event_type),
    title: String(row.title),
    detail: (row.detail as string) ?? null,
    actorUserId: (row.actor_user_id as string) ?? null,
    searchRunId: (row.search_run_id as string) ?? null,
    meta: (row.meta_json as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  };
}
