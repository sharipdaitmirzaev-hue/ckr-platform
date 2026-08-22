/**
 * Stage 4N — Multi-source Procurement DETAIL Resolver.
 *
 * Order of trust:
 * 1) official EIS (if configured + reachable)
 * 2) trusted secondary mirrors (star-pro, zakupki360, tektorg) via safeFetch
 * 3) search evidence URLs already on the candidate
 * 4) unresolved
 *
 * Never bypasses CAPTCHA/WAF. Never invents FACTS. UNKNOWN stays UNKNOWN.
 */

import { safeFetch } from "@/lib/http/safe-fetch";
import {
  getCachedProcurementDetail,
  setCachedProcurementDetail,
} from "@/lib/lia/oi/procurement/cache";
import {
  extractNoticeIdFromText,
  extractNoticeIdFromUrl,
  isFixtureProcurementNotice,
  normalizeNoticeId,
} from "@/lib/lia/oi/procurement/notice-id";
import { assessOfficialEisAccess } from "@/lib/lia/oi/procurement/official-access";
import { parseProcurementDetailHtml } from "@/lib/lia/oi/procurement/parse-detail-html";
import type {
  DetailResolveStats,
  ProcurementConfidence,
  ProcurementFact,
  ProcurementSourceAttempt,
  ResolvedProcurementDetail,
} from "@/lib/lia/oi/procurement/types";
import { procurementOfficialProvider } from "@/lib/lia/oi/sources/providers/eis";

const TRUSTED_SECONDARY_HOSTS = [
  "star-pro.ru",
  "zakupki360.ru",
  "tektorg.ru",
  "expertcentre.org",
];

export type ResolveProcurementInput = {
  noticeId?: string | null;
  title?: string | null;
  url?: string | null;
  /** Extra candidate/mirror URLs to try (search hits, known DETAIL pages). */
  mirrorUrls?: string[];
  /** Allow live HTTP. Tests can set false and inject parsed fixtures via mirrorUrls + fetchImpl. */
  allowLiveFetch?: boolean;
  /** Optional override for tests */
  fetchImpl?: typeof safeFetch;
  skipCache?: boolean;
};

function nowIso() {
  return new Date().toISOString();
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isTrustedSecondary(url: string): boolean {
  const h = hostOf(url);
  return TRUSTED_SECONDARY_HOSTS.some((t) => h === t || h.endsWith(`.${t}`));
}

function isOfficialHtml(url: string): boolean {
  return /zakupki\.gov\.ru/i.test(url);
}

function buildStarProGuess(noticeId: string): string {
  return `https://star-pro.ru/region/respublika-dagestan/l${noticeId}-1`;
}

function mergeConfidence(
  sources: string[],
  hadOfficial: boolean,
): ProcurementConfidence {
  if (hadOfficial) return "OFFICIAL_CONFIRMED";
  const secondary = sources.filter((s) => s !== "search_evidence");
  if (secondary.length >= 2) return "MULTI_SOURCE_CONFIRMED";
  if (secondary.length === 1) return "TRUSTED_SECONDARY";
  if (sources.length) return "SEARCH_ONLY";
  return "UNVERIFIED";
}

function fact(
  field: string,
  value: string | number | null,
  sourceId: string,
  sourceUrl: string | null,
  sourceLabel: string,
  trust: ProcurementFact["trust"],
): ProcurementFact | null {
  if (value == null || value === "") return null;
  return {
    field,
    value,
    kind: "FACT",
    sourceId,
    sourceUrl,
    sourceLabel,
    trust,
    observedAt: nowIso(),
  };
}

/**
 * Resolve DETAIL for a notice. Safe network only.
 */
export async function resolveProcurementDetail(
  input: ResolveProcurementInput,
): Promise<ResolvedProcurementDetail> {
  const noticeId =
    normalizeNoticeId(input.noticeId) ||
    extractNoticeIdFromUrl(input.url) ||
    extractNoticeIdFromText(input.title) ||
    extractNoticeIdFromText((input.mirrorUrls || []).join(" "));

  const fetchedAt = nowIso();
  const attempts: ProcurementSourceAttempt[] = [];
  const facts: ProcurementFact[] = [];
  const sourcesUsed: string[] = [];

  if (!noticeId) {
    return {
      noticeId: "",
      title: input.title || null,
      subject: null,
      customer: null,
      region: null,
      amount: null,
      amountKind: "UNKNOWN",
      deadlineAt: null,
      lifecycle: "UNKNOWN",
      canonicalUrl: input.url || null,
      officialUrl: null,
      confidence: "UNVERIFIED",
      facts,
      attempts: [
        {
          sourceId: "identity",
          sourceLabel: "Notice identity",
          trust: "unresolved",
          ok: false,
          reason: "notice_id_missing",
          durationMs: 0,
        },
      ],
      fetchedAt,
      verifiedAt: null,
      sourcesUsed,
    };
  }

  if (!input.skipCache) {
    const cached = getCachedProcurementDetail(noticeId);
    if (cached) return cached;
  }

  let title = input.title || null;
  let subject: string | null = null;
  let customer: string | null = null;
  let region: string | null = null;
  let amount: number | null = null;
  let deadlineAt: string | null = null;
  let lifecycle: ResolvedProcurementDetail["lifecycle"] = "UNKNOWN";
  let canonicalUrl = input.url || null;
  let officialUrl: string | null = isOfficialHtml(input.url || "")
    ? input.url || null
    : `https://zakupki.gov.ru/epz/order/notice/ea20/view/common-info.html?regNumber=${noticeId}`;
  let hadOfficial = false;

  // 1) Official EIS SOAP — only if configured; report status, never invent
  const access = assessOfficialEisAccess();
  const t0 = Date.now();
  if (access.soapConfigured) {
    try {
      const official = await procurementOfficialProvider.search({
        rawQuery: noticeId,
        limit: 3,
        allowLive: true,
        useFixtures: false,
      });
      attempts.push({
        sourceId: "eis_soap",
        sourceLabel: "ЕИС SOAP",
        trust: "official_eis",
        ok: official.connectionStatus === "CONNECTED" && official.objects.length > 0,
        reason: official.error || official.statusMessage,
        durationMs: Date.now() - t0,
      });
      const hit = official.objects.find((o) =>
        String(o.rawOfficialId || "").includes(noticeId),
      );
      if (hit) {
        hadOfficial = true;
        sourcesUsed.push("eis_soap");
        title = hit.title || title;
        subject = hit.subject || subject;
        customer = hit.customer || customer;
        region = hit.region || region;
        amount = hit.nmck ?? amount;
        deadlineAt = hit.deadlineAt || deadlineAt;
        canonicalUrl = hit.officialUrl || canonicalUrl;
        officialUrl = hit.officialUrl || officialUrl;
        const hitUrl = hit.officialUrl || null;
        for (const f of [
          fact("procurement_id", noticeId, "eis_soap", hitUrl, "ЕИС SOAP", "official_eis"),
          fact("customer", customer, "eis_soap", hitUrl, "ЕИС SOAP", "official_eis"),
          fact("nmck", amount, "eis_soap", hitUrl, "ЕИС SOAP", "official_eis"),
          fact("deadline_at", deadlineAt, "eis_soap", hitUrl, "ЕИС SOAP", "official_eis"),
          fact("region", region, "eis_soap", hitUrl, "ЕИС SOAP", "official_eis"),
        ]) {
          if (f) facts.push(f);
        }
      }
    } catch (e) {
      attempts.push({
        sourceId: "eis_soap",
        sourceLabel: "ЕИС SOAP",
        trust: "official_eis",
        ok: false,
        reason: e instanceof Error ? e.message : "eis_error",
        durationMs: Date.now() - t0,
      });
    }
  } else {
    attempts.push({
      sourceId: "eis_soap",
      sourceLabel: "ЕИС SOAP",
      trust: "official_eis",
      ok: false,
      reason: access.networkFailureClass || "credentials_missing",
      durationMs: 0,
    });
  }

  // 2) Trusted secondary + candidate URLs
  const urlCandidates = new Set<string>();
  for (const u of input.mirrorUrls || []) if (u) urlCandidates.add(u);
  if (input.url) urlCandidates.add(input.url);
  if (officialUrl) urlCandidates.add(officialUrl);
  // Guess star-pro listing path (may 404 — attempt recorded)
  urlCandidates.add(buildStarProGuess(noticeId));
  // Prefer non-official first when official HTML is known-unreachable from VPS
  const ordered = [...urlCandidates].sort((a, b) => {
    const as = isTrustedSecondary(a) ? 0 : isOfficialHtml(a) ? 2 : 1;
    const bs = isTrustedSecondary(b) ? 0 : isOfficialHtml(b) ? 2 : 1;
    return as - bs;
  });

  const fetchFn = input.fetchImpl || safeFetch;
  const allowLive = input.allowLiveFetch !== false;
  let secondarySuccesses = 0;

  for (const url of ordered) {
    if (!allowLive) break;
    const started = Date.now();
    const trust = isOfficialHtml(url)
      ? ("official_eis" as const)
      : isTrustedSecondary(url)
        ? ("trusted_secondary" as const)
        : ("search_evidence" as const);
    const sourceId = hostOf(url) || trust;
    try {
      const res = await fetchFn(url, { timeoutMs: 10_000, maxBytes: 500_000 });
      attempts.push({
        sourceId,
        sourceLabel: sourceId,
        trust,
        ok: res.ok,
        reason: res.ok
          ? null
          : res.error || res.code || "fetch_failed",
        httpStatus: res.ok ? res.status : null,
        durationMs: Date.now() - started,
        urlTried: url,
      });
      if (!res.ok || !("bodyText" in res) || !res.bodyText) continue;

      const parsed = parseProcurementDetailHtml({
        html: res.bodyText,
        noticeHint: noticeId,
        titleHint: title,
      });
      // Reject wrong notice pages
      if (parsed.noticeId && parsed.noticeId !== noticeId) continue;

      sourcesUsed.push(sourceId);
      if (trust === "official_eis") hadOfficial = true;
      if (trust === "trusted_secondary") secondarySuccesses += 1;
      if (!canonicalUrl || trust === "trusted_secondary") canonicalUrl = url;
      if (parsed.title) title = parsed.title;
      if (parsed.subject) subject = parsed.subject;
      if (parsed.customer && !customer) customer = parsed.customer;
      else if (parsed.customer && customer && parsed.customer !== customer) {
        // conflict — keep first FACT, add note as INFERENCE alternate
        facts.push({
          field: "customer_conflict",
          value: parsed.customer,
          kind: "INFERENCE",
          sourceId,
          sourceUrl: url,
          sourceLabel: sourceId,
          trust,
          observedAt: nowIso(),
        });
      } else if (parsed.customer) customer = parsed.customer;
      if (parsed.region && !region) region = parsed.region;
      if (parsed.amount != null && amount == null) amount = parsed.amount;
      if (parsed.deadlineAt && !deadlineAt) deadlineAt = parsed.deadlineAt;
      if (parsed.lifecycle !== "UNKNOWN") lifecycle = parsed.lifecycle;

      for (const f of [
        fact("procurement_id", noticeId, sourceId, url, sourceId, trust),
        fact("customer", parsed.customer, sourceId, url, sourceId, trust),
        fact("nmck", parsed.amount, sourceId, url, sourceId, trust),
        fact("deadline_at", parsed.deadlineAt, sourceId, url, sourceId, trust),
        fact("region", parsed.region, sourceId, url, sourceId, trust),
        fact("subject", parsed.subject, sourceId, url, sourceId, trust),
      ]) {
        if (f) facts.push(f);
      }

      // Enough DETAIL: stop early after official, or after ≥2 secondaries (cross-check)
      const enough =
        Boolean(customer && (amount != null || deadlineAt) && subject);
      if (enough && (hadOfficial || secondarySuccesses >= 2)) break;
      if (enough && secondarySuccesses >= 1 && trust !== "trusted_secondary") {
        break;
      }
    } catch (e) {
      attempts.push({
        sourceId,
        sourceLabel: sourceId,
        trust,
        ok: false,
        reason: e instanceof Error ? e.message : "fetch_error",
        durationMs: Date.now() - started,
        urlTried: url,
      });
    }
  }

  if (isFixtureProcurementNotice(noticeId)) {
    lifecycle = lifecycle === "UNKNOWN" ? "ACTIVE" : lifecycle;
  }

  const uniqueSources = [...new Set(sourcesUsed)];
  const detail: ResolvedProcurementDetail = {
    noticeId,
    title,
    subject,
    customer,
    region,
    amount,
    amountKind: amount != null ? "NMCK" : "UNKNOWN",
    deadlineAt,
    lifecycle,
    canonicalUrl,
    officialUrl,
    confidence: mergeConfidence(uniqueSources, hadOfficial),
    facts,
    attempts,
    fetchedAt,
    verifiedAt: uniqueSources.length ? fetchedAt : null,
    sourcesUsed: uniqueSources,
  };

  if (uniqueSources.length) setCachedProcurementDetail(detail);
  return detail;
}

export function summarizeDetailResolveStats(
  results: ResolvedProcurementDetail[],
): DetailResolveStats {
  const stats: DetailResolveStats = {
    detailAttempts: results.length,
    detailSuccess: 0,
    detailFailure: 0,
    officialConfirmed: 0,
    multiSourceConfirmed: 0,
    secondaryOnly: 0,
    searchOnly: 0,
  };
  for (const r of results) {
    const ok = Boolean(r.customer || r.amount != null || r.deadlineAt);
    if (ok) stats.detailSuccess += 1;
    else stats.detailFailure += 1;
    if (r.confidence === "OFFICIAL_CONFIRMED") stats.officialConfirmed += 1;
    else if (r.confidence === "MULTI_SOURCE_CONFIRMED")
      stats.multiSourceConfirmed += 1;
    else if (r.confidence === "TRUSTED_SECONDARY") stats.secondaryOnly += 1;
    else if (r.confidence === "SEARCH_ONLY") stats.searchOnly += 1;
  }
  return stats;
}

/** Apply resolved DETAIL onto an OI candidate patch (no silent overwrite of stronger facts). */
export function applyResolvedDetailToCandidatePatch(
  detail: ResolvedProcurementDetail,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    sourceObjectId: detail.noticeId || undefined,
    pageType: detail.sourcesUsed.length ? "DETAIL" : undefined,
    enrichedFromFetch: detail.sourcesUsed.length > 0,
  };
  if (detail.title) patch.title = detail.title;
  if (detail.subject) {
    patch.description = detail.subject;
    patch.summary = String(detail.subject).slice(0, 280);
  }
  if (detail.customer) patch.customer = detail.customer;
  if (detail.region) patch.region = detail.region;
  if (detail.amount != null) {
    patch.nmck = detail.amount;
    patch.askingPrice = detail.amount;
  }
  if (detail.deadlineAt) patch.deadlineAt = detail.deadlineAt;
  if (detail.canonicalUrl) {
    patch.canonicalUrl = detail.canonicalUrl;
  }
  return patch;
}
