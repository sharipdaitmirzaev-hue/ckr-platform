/**
 * SupabaseLiaOiStore — persistent OI memory (Stage 2B).
 * Requires applied migrations + service role. No silent fallback on write failure.
 */

import {
  buildOpportunityFingerprint,
  diffTrackedFields,
  mergeRediscovery,
  OWNER_LOCKED_STATUSES,
} from "@/lib/lia/oi/fingerprint";
import { oiId } from "@/lib/lia/oi/id";
import { canonicalUrl } from "@/lib/lia/oi/normalize";
import {
  assignmentToRow,
  candidateToRow,
  feedbackToRow,
  hypothesisToRow,
  reportToRow,
  rowToAssignment,
  rowToCandidate,
  rowToChange,
  rowToEvent,
  rowToFeedback,
  rowToHypothesis,
  rowToReport,
  rowToSearchRequest,
  rowToSource,
  searchRequestToRow,
  sourceToRow,
  type OppRow,
} from "@/lib/lia/oi/store/mappers";
import { createOiAdminClient } from "@/lib/lia/oi/store/supabase-client";
import {
  LiaOiStoreWriteError,
  paginate,
  type LiaOiStore,
  type LiaOiUpsertResult,
} from "@/lib/lia/oi/store-types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LiaOiAssignment,
  LiaOiCandidate,
  LiaOiCandidateListFilter,
  LiaOiFeedback,
  LiaOiHypothesis,
  LiaOiOpportunityChange,
  LiaOiReport,
  LiaOiSearchRequest,
} from "@/types/lia-oi";

function ensureIdentity(item: LiaOiCandidate): LiaOiCandidate {
  const canon =
    item.canonicalUrl ||
    (item.sources[0]?.url ? canonicalUrl(item.sources[0].url) : "");
  const fingerprint =
    item.fingerprint ||
    buildOpportunityFingerprint({ ...item, canonicalUrl: canon });
  return {
    ...item,
    canonicalUrl: canon || item.canonicalUrl,
    fingerprint,
    ownerLocked:
      item.ownerLocked || OWNER_LOCKED_STATUSES.has(item.status) || false,
  };
}

async function throwWrite(op: string, error: { message?: string } | null) {
  if (!error) return;
  throw new LiaOiStoreWriteError(
    `Не удалось сохранить данные OI (${op}): ${error.message || "ошибка БД"}. Данные не записаны.`,
    error,
  );
}

export class SupabaseLiaOiStore implements LiaOiStore {
  readonly kind = "supabase" as const;

  constructor(private readonly db: SupabaseClient = createOiAdminClient()) {}

  private async loadSources(opportunityId: string) {
    const { data, error } = await this.db
      .from("lia_oi_sources")
      .select("*")
      .eq("opportunity_id", opportunityId);
    await throwWrite("sources.select", error);
    return (data ?? []).map((r) => rowToSource(r as OppRow));
  }

  private async hydrate(row: OppRow): Promise<LiaOiCandidate> {
    const sources = await this.loadSources(String(row.id));
    return rowToCandidate(row, sources);
  }

  async getCandidateByFingerprint(fingerprint: string) {
    const { data, error } = await this.db
      .from("lia_oi_opportunities")
      .select("*")
      .eq("fingerprint", fingerprint)
      .maybeSingle();
    await throwWrite("opportunities.byFingerprint", error);
    if (!data) return null;
    return this.hydrate(data as OppRow);
  }

  async getCandidate(id: string) {
    const { data, error } = await this.db
      .from("lia_oi_opportunities")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    await throwWrite("opportunities.get", error);
    if (!data) return null;
    return this.hydrate(data as OppRow);
  }

  async upsertCandidates(
    items: LiaOiCandidate[],
    options?: {
      searchRunId?: string;
      reason?: "rediscovery" | "owner_update";
    },
  ): Promise<LiaOiUpsertResult> {
    const createdIds: string[] = [];
    const updatedIds: string[] = [];
    const changes: LiaOiOpportunityChange[] = [];
    const out: LiaOiCandidate[] = [];
    const isOwnerUpdate = options?.reason === "owner_update";

    for (const raw of items) {
      const incoming = ensureIdentity(raw);
      const existing =
        (incoming.fingerprint
          ? await this.getCandidateByFingerprint(incoming.fingerprint)
          : null) ?? (await this.getCandidate(incoming.id));

      let merged: LiaOiCandidate;
      let diffs: ReturnType<typeof diffTrackedFields> = [];
      const isCreate = !existing;
      if (existing) {
        merged = mergeRediscovery(existing, { ...incoming, id: existing.id });
        diffs = diffTrackedFields(existing, merged);
        updatedIds.push(existing.id);
      } else {
        merged = {
          ...incoming,
          firstSeenAt: incoming.firstSeenAt || new Date().toISOString(),
        };
        createdIds.push(merged.id);
      }

      if (options?.searchRunId) {
        merged = { ...merged, searchRequestId: options.searchRunId };
      }

      // Parent row first — child FKs (events/changes/sources) require opportunity id.
      const { error: upErr } = await this.db
        .from("lia_oi_opportunities")
        .upsert(candidateToRow(merged), { onConflict: "id" });
      await throwWrite("opportunities.upsert", upErr);

      if (existing) {
        for (const d of diffs) {
          const change: LiaOiOpportunityChange = {
            id: oiId("chg"),
            opportunityId: existing.id,
            fieldName: d.field,
            oldValue: d.oldValue,
            newValue: d.newValue,
            changeKind:
              d.field === "status"
                ? isOwnerUpdate
                  ? "OWNER_DECISION"
                  : "STATUS_CHANGE"
                : "FIELD_UPDATE",
            sourceRunId: options?.searchRunId ?? null,
            createdAt: new Date().toISOString(),
          };
          const { error: chErr } = await this.db
            .from("lia_oi_opportunity_changes")
            .insert({
              id: change.id,
              opportunity_id: change.opportunityId,
              field_name: change.fieldName,
              old_value: change.oldValue,
              new_value: change.newValue,
              change_kind: change.changeKind,
              source_run_id: change.sourceRunId,
              created_at: change.createdAt,
            });
          await throwWrite("opportunity_changes.insert", chErr);
          changes.push(change);
        }

        if (!isOwnerUpdate) {
          const { error: snapErr } = await this.db
            .from("lia_oi_opportunity_snapshots")
            .insert({
              id: oiId("snap"),
              opportunity_id: existing.id,
              snapshot_json: {
                title: merged.title,
                askingPrice: merged.askingPrice,
                investmentRequired: merged.investmentRequired,
                status: merged.status,
                region: merged.region,
                budgetFit: merged.budgetFit,
                resultBucket: merged.resultBucket,
              },
              reason: "rediscovery",
              search_run_id: options?.searchRunId ?? null,
            });
          await throwWrite("opportunity_snapshots.insert", snapErr);

          const { error: evtErr } = await this.db
            .from("lia_oi_opportunity_events")
            .insert({
              id: oiId("evt"),
              opportunity_id: existing.id,
              event_type: "REDISCOVERY",
              title: "Найдена повторно",
              detail:
                diffs.length > 0
                  ? `Изменения: ${diffs.map((d) => d.field).join(", ")}`
                  : "Без существенных изменений полей",
              search_run_id: options?.searchRunId ?? null,
              meta_json: {},
            });
          await throwWrite("opportunity_events.insert", evtErr);
        }
      } else if (isCreate) {
        const { error: evtErr } = await this.db
          .from("lia_oi_opportunity_events")
          .insert({
            id: oiId("evt"),
            opportunity_id: merged.id,
            event_type: "FIRST_SEEN",
            title: "Впервые найдена",
            detail: merged.title,
            search_run_id: options?.searchRunId ?? null,
            meta_json: {},
            created_at: merged.firstSeenAt,
          });
        await throwWrite("opportunity_events.insert", evtErr);
      }

      // replace sources for this opportunity (URLs only — no HTML)
      await this.db
        .from("lia_oi_sources")
        .delete()
        .eq("opportunity_id", merged.id);
      if (merged.sources.length) {
        const { error: srcErr } = await this.db
          .from("lia_oi_sources")
          .insert(merged.sources.map((s) => sourceToRow(s, merged.id)));
        await throwWrite("sources.insert", srcErr);
      }

      if (options?.searchRunId) {
        const { error: linkErr } = await this.db
          .from("lia_oi_search_run_candidates")
          .upsert(
            {
              search_run_id: options.searchRunId,
              opportunity_id: merged.id,
              result_bucket: merged.resultBucket ?? null,
              rank_in_run: null,
            },
            { onConflict: "search_run_id,opportunity_id" },
          );
        await throwWrite("search_run_candidates.upsert", linkErr);
      }

      out.push(merged);
    }

    return { candidates: out, createdIds, updatedIds, changes };
  }

  async listCandidates(filter?: LiaOiCandidateListFilter) {
    let q = this.db
      .from("lia_oi_opportunities")
      .select("*", { count: "exact" })
      .order("score_overall", { ascending: false });

    if (filter?.status) q = q.eq("status", filter.status);
    if (filter?.bucket) q = q.eq("result_bucket", filter.bucket);
    if (filter?.region) q = q.ilike("region", `%${filter.region}%`);
    if (filter?.industry) q = q.ilike("industry", `%${filter.industry}%`);
    if (filter?.budgetFit) q = q.eq("budget_fit", filter.budgetFit);
    if (filter?.minOverall != null) {
      q = q.gte("score_overall", filter.minOverall);
    }
    if (filter?.minConfidence != null) {
      q = q.gte("score_confidence", filter.minConfidence);
    }
    if (filter?.savedOnly) {
      q = q.in("status", [
        "SAVED",
        "INTERESTING",
        "DEEP_RESEARCH",
        "PROJECT_CREATED",
      ]);
    }
    if (filter?.rejectedOnly) q = q.eq("status", "REJECTED");
    if (filter?.dateFrom) q = q.gte("first_seen_at", filter.dateFrom);
    if (filter?.dateTo) q = q.lte("first_seen_at", filter.dateTo);
    if (filter?.q) {
      q = q.or(
        `title.ilike.%${filter.q}%,description.ilike.%${filter.q}%`,
      );
    }

    const page = Math.max(1, filter?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter?.pageSize ?? 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await q.range(from, to);
    await throwWrite("opportunities.list", error);

    const items: LiaOiCandidate[] = [];
    for (const row of data ?? []) {
      items.push(await this.hydrate(row as OppRow));
    }
    if (filter?.source) {
      const s = filter.source.toLowerCase();
      const filtered = items.filter((c) =>
        c.sources.some(
          (x) =>
            x.name.toLowerCase().includes(s) ||
            x.url.toLowerCase().includes(s),
        ),
      );
      return paginate(filtered, 1, pageSize);
    }

    const total = count ?? items.length;
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async saveSearchRequest(req: LiaOiSearchRequest) {
    const { error } = await this.db
      .from("lia_oi_search_runs")
      .upsert(searchRequestToRow(req), { onConflict: "id" });
    await throwWrite("search_runs.upsert", error);
  }

  async listSearchRequests(options?: { page?: number; pageSize?: number }) {
    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options?.pageSize ?? 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await this.db
      .from("lia_oi_search_runs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    await throwWrite("search_runs.list", error);
    const items = (data ?? []).map((r) => rowToSearchRequest(r as OppRow));
    const total = count ?? items.length;
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getSearchRequest(id: string) {
    const { data, error } = await this.db
      .from("lia_oi_search_runs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    await throwWrite("search_runs.get", error);
    if (!data) return null;
    return rowToSearchRequest(data as OppRow);
  }

  async listCandidatesForSearchRun(searchRunId: string) {
    const { data, error } = await this.db
      .from("lia_oi_search_run_candidates")
      .select("opportunity_id")
      .eq("search_run_id", searchRunId);
    await throwWrite("search_run_candidates.list", error);
    const ids = (data ?? []).map((r) => String((r as OppRow).opportunity_id));
    const out: LiaOiCandidate[] = [];
    for (const id of ids) {
      const c = await this.getCandidate(id);
      if (c) out.push(c);
    }
    return out;
  }

  async addFeedback(item: LiaOiFeedback) {
    const { error } = await this.db
      .from("lia_oi_feedback")
      .insert(feedbackToRow(item));
    await throwWrite("feedback.insert", error);

    const cand = await this.getCandidate(item.candidateId);
    if (cand && OWNER_LOCKED_STATUSES.has(cand.status)) {
      const { error: upErr } = await this.db
        .from("lia_oi_opportunities")
        .update({
          owner_locked: true,
          owner_status_set_at: item.createdAt,
          owner_status_set_by: item.createdBy.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
          )
            ? item.createdBy
            : null,
        })
        .eq("id", item.candidateId);
      await throwWrite("opportunities.owner_lock", upErr);
    }

    const { error: evtErr } = await this.db
      .from("lia_oi_opportunity_events")
      .insert({
        id: oiId("evt"),
        opportunity_id: item.candidateId,
        event_type: "OWNER_FEEDBACK",
        title: `Владелец: ${item.event}`,
        detail: item.reason ?? null,
        actor_user_id: item.createdBy.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        )
          ? item.createdBy
          : null,
        meta_json: {},
        created_at: item.createdAt,
      });
    await throwWrite("opportunity_events.insert", evtErr);
  }

  async listFeedback(options?: {
    candidateId?: string;
    page?: number;
    pageSize?: number;
  }) {
    let q = this.db
      .from("lia_oi_feedback")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (options?.candidateId) {
      q = q.eq("opportunity_id", options.candidateId);
    }
    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options?.pageSize ?? 50));
    const from = (page - 1) * pageSize;
    const { data, error, count } = await q.range(from, from + pageSize - 1);
    await throwWrite("feedback.list", error);
    const items = (data ?? []).map((r) => rowToFeedback(r as OppRow));
    const total = count ?? items.length;
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async addAssignment(item: LiaOiAssignment) {
    const { error } = await this.db
      .from("lia_oi_assignments")
      .insert(assignmentToRow(item));
    await throwWrite("assignments.insert", error);
    const { error: evtErr } = await this.db
      .from("lia_oi_opportunity_events")
      .insert({
        id: oiId("evt"),
        opportunity_id: item.candidateId,
        event_type: "ASSIGNMENT",
        title: `Поручение: ${item.kind}`,
        detail: item.instruction,
        actor_user_id: item.createdBy.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        )
          ? item.createdBy
          : null,
        meta_json: {},
        created_at: item.createdAt,
      });
    await throwWrite("opportunity_events.insert", evtErr);
  }

  async updateAssignment(item: LiaOiAssignment) {
    const { error } = await this.db
      .from("lia_oi_assignments")
      .upsert(assignmentToRow(item), { onConflict: "id" });
    await throwWrite("assignments.upsert", error);
  }

  async listAssignments(options?: { page?: number; pageSize?: number }) {
    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options?.pageSize ?? 50));
    const from = (page - 1) * pageSize;
    const { data, error, count } = await this.db
      .from("lia_oi_assignments")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    await throwWrite("assignments.list", error);
    const items = (data ?? []).map((r) => rowToAssignment(r as OppRow));
    const total = count ?? items.length;
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async addReport(item: LiaOiReport) {
    const { error } = await this.db
      .from("lia_oi_reports")
      .insert(reportToRow(item));
    await throwWrite("reports.insert", error);
  }

  async listReports(options?: { page?: number; pageSize?: number }) {
    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options?.pageSize ?? 50));
    const from = (page - 1) * pageSize;
    const { data, error, count } = await this.db
      .from("lia_oi_reports")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    await throwWrite("reports.list", error);
    const items = (data ?? []).map((r) => rowToReport(r as OppRow));
    const total = count ?? items.length;
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async setHypotheses(items: LiaOiHypothesis[]) {
    // Replace set: delete all then insert (owner-only table, small)
    const { error: delErr } = await this.db
      .from("lia_oi_hypotheses")
      .delete()
      .neq("id", "");
    await throwWrite("hypotheses.delete", delErr);
    if (!items.length) return;
    const { error } = await this.db
      .from("lia_oi_hypotheses")
      .insert(items.map(hypothesisToRow));
    await throwWrite("hypotheses.insert", error);
  }

  async listHypotheses() {
    const { data, error } = await this.db
      .from("lia_oi_hypotheses")
      .select("*")
      .order("created_at", { ascending: false });
    await throwWrite("hypotheses.list", error);
    return (data ?? []).map((r) => rowToHypothesis(r as OppRow));
  }

  async listOpportunityEvents(opportunityId: string) {
    const { data, error } = await this.db
      .from("lia_oi_opportunity_events")
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("created_at", { ascending: false });
    await throwWrite("opportunity_events.list", error);
    return (data ?? []).map((r) => rowToEvent(r as OppRow));
  }

  async listOpportunityChanges(opportunityId: string) {
    const { data, error } = await this.db
      .from("lia_oi_opportunity_changes")
      .select("*")
      .eq("opportunity_id", opportunityId)
      .order("created_at", { ascending: false });
    await throwWrite("opportunity_changes.list", error);
    return (data ?? []).map((r) => rowToChange(r as OppRow));
  }
}
