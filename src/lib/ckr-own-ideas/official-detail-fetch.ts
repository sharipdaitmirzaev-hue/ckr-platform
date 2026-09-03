/**
 * Stage 4Q.4.2 — bounded source-specific official DETAIL fetch.
 * Uses safeFetch + RunBudgetContext. Not a general-purpose crawler.
 */
import { CKR_OWN_IDEAS_BUDGETS } from "@/config/ckr-own-ideas";
import {
  canConsumeResolution,
  getActiveOwnIdeaBudget,
  noteActiveExternalHttp,
  remainingMs,
  requestTimeoutMs,
  type OwnIdeaRunBudget,
} from "@/lib/ckr-own-ideas/run-budget";
import {
  applyTorgiLotToCandidate,
  extractTorgiLotId,
  isFedresursHost,
  isTorgiHost,
  parseTorgiLotJson,
  torgiLotApiUrl,
  torgiLotPageUrl,
} from "@/lib/ckr-own-ideas/torgi-lot";
import { stripHtml } from "@/lib/lia/oi/enrichment/html";
import { safeFetch, type SafeFetchFailure, type SafeFetchResult } from "@/lib/http/safe-fetch";
import type { LiaOiCandidate } from "@/types/lia-oi";
import type { OwnIdeaFetchErrorCategory } from "@/types/ckr-own-ideas";

export type OfficialFetchStrategy =
  | "torgi_api"
  | "torgi_html"
  | "fedresurs_html"
  | "safe_html";

export type OfficialDetailTransport = (
  url: string,
  opts: {
    timeoutMs: number;
    accept?: string;
    referer?: string;
    allowedContentTypes?: string[];
  },
) => Promise<SafeFetchResult | SafeFetchFailure>;

export type OfficialDetailFetchOk = {
  ok: true;
  candidate: LiaOiCandidate;
  strategy: OfficialFetchStrategy;
  source: "torgi" | "fedresurs" | "other";
  url: string;
  finalUrl: string;
  status: number;
  contentType: string;
  elapsedMs: number;
  bodyText: string;
  errorCategory: null;
};

export type OfficialDetailFetchFail = {
  ok: false;
  candidate: null;
  strategy: OfficialFetchStrategy;
  source: "torgi" | "fedresurs" | "other";
  url: string;
  finalUrl: string | null;
  status: number | null;
  contentType: string | null;
  elapsedMs: number;
  errorCategory: OwnIdeaFetchErrorCategory;
  bodyText?: undefined;
};

export type OfficialDetailFetchResult = OfficialDetailFetchOk | OfficialDetailFetchFail;

export function isHtmlShell(bodyText: string, contentType?: string | null): boolean {
  const ct = (contentType || "").toLowerCase();
  const looksHtml =
    /html/.test(ct) || /<html|<app-root|ng-version|<!doctype html/i.test(bodyText.slice(0, 8_000));
  if (!looksHtml) return false;
  const spa = /<app-root\b|ng-version=|webpackJsonp|id=["']root["']/i.test(bodyText);
  const text = stripHtml(bodyText).replace(/\s+/g, " ").trim();
  const hasLotCopy =
    /lotName|начальн\w{0,8}\s+цен|номер\s+лота|предмет\s+торгов|организатор\s+торгов/i.test(
      bodyText,
    ) && text.length > 240;
  if (spa && !hasLotCopy) return true;
  if (spa && text.length < 400) return true;
  return false;
}

export function classifyOfficialFetchFailure(
  fail: SafeFetchFailure,
  opts?: { expectJson?: boolean; bodyText?: string | null; contentType?: string | null },
): OwnIdeaFetchErrorCategory {
  const msg = `${fail.error || ""} ${fail.code || ""}`;
  if (/ssl|tls|handshake|certificate/i.test(msg)) return "TLS_ERROR";
  if (fail.code === "dns_failed") return "DNS_ERROR";
  if (fail.code === "redirect_limit" || /Redirect without Location/i.test(fail.error || "")) {
    return "REDIRECT_ERROR";
  }
  if (fail.code === "bad_content_type") return "UNSUPPORTED_CONTENT_TYPE";
  if (fail.code === "timeout") {
    return fail.status ? "RESPONSE_TIMEOUT" : "CONNECT_TIMEOUT";
  }
  if (fail.code === "http_error") {
    const st = fail.status ?? Number((fail.error || "").match(/HTTP\s+(\d+)/)?.[1]);
    if (st >= 500) return "HTTP_5XX";
    if (st >= 400) return "HTTP_4XX";
    return "OTHER";
  }
  if (opts?.bodyText && isHtmlShell(opts.bodyText, opts.contentType || fail.contentType)) {
    return "HTML_SHELL";
  }
  if (opts?.expectJson) return "OFFICIAL_API_ERROR";
  return "OTHER";
}

function fail(
  partial: Omit<OfficialDetailFetchFail, "ok" | "candidate" | "bodyText">,
): OfficialDetailFetchFail {
  return { ok: false, candidate: null, ...partial };
}

async function callTransport(
  url: string,
  opts: {
    timeoutMs: number;
    accept?: string;
    referer?: string;
    allowedContentTypes?: string[];
    transport?: OfficialDetailTransport;
  },
): Promise<SafeFetchResult | SafeFetchFailure> {
  if (opts.transport) {
    if (!noteActiveExternalHttp("resolution")) {
      return { ok: false, error: "budget_external", code: "network", elapsedMs: 0 };
    }
    return opts.transport(url, {
      timeoutMs: opts.timeoutMs,
      accept: opts.accept,
      referer: opts.referer,
      allowedContentTypes: opts.allowedContentTypes,
    });
  }
  return safeFetch(url, {
    timeoutMs: opts.timeoutMs,
    accept: opts.accept,
    referer: opts.referer,
    allowedContentTypes: opts.allowedContentTypes,
    maxBytes: 400_000,
    maxRedirects: 3,
  });
}

function remainingForCandidate(deadlineAt: number): number {
  return Math.max(0, deadlineAt - Date.now());
}

export async function fetchOfficialDetail(input: {
  candidate: LiaOiCandidate;
  url: string;
  budget: OwnIdeaRunBudget;
  transport?: OfficialDetailTransport;
}): Promise<OfficialDetailFetchResult> {
  const url = input.url;
  const source: OfficialDetailFetchResult["source"] = isTorgiHost(url)
    ? "torgi"
    : isFedresursHost(url)
      ? "fedresurs"
      : "other";
  const budget = getActiveOwnIdeaBudget() || input.budget;
  const wallCap = requestTimeoutMs(
    budget,
    CKR_OWN_IDEAS_BUDGETS.perDetailTimeoutMs,
    "resolution",
  );
  const deadlineAt = Date.now() + wallCap;

  if (source === "torgi") {
    return fetchTorgi({ ...input, deadlineAt, wallCap, budget });
  }
  if (source === "fedresurs") {
    return fetchFedresursHtml({ ...input, deadlineAt, wallCap, budget });
  }
  return fetchHtml({
    ...input,
    deadlineAt,
    wallCap,
    budget,
    strategy: "safe_html",
    source: "other",
  });
}

async function fetchTorgi(input: {
  candidate: LiaOiCandidate;
  url: string;
  budget: OwnIdeaRunBudget;
  transport?: OfficialDetailTransport;
  deadlineAt: number;
  wallCap: number;
}): Promise<OfficialDetailFetchResult> {
  const lotId = extractTorgiLotId(input.url) || input.candidate.sourceObjectId;
  if (!lotId) {
    return fail({
      strategy: "torgi_api",
      source: "torgi",
      url: input.url,
      finalUrl: input.url,
      status: null,
      contentType: null,
      elapsedMs: 0,
      errorCategory: "PARSE_ERROR",
    });
  }
  const apiUrl = torgiLotApiUrl(lotId);
  const pageUrl = torgiLotPageUrl(lotId);
  const apiTimeout = Math.max(250, remainingForCandidate(input.deadlineAt));
  if (!canConsumeResolution(input.budget) || apiTimeout < 250) {
    return fail({
      strategy: "torgi_api",
      source: "torgi",
      url: apiUrl,
      finalUrl: apiUrl,
      status: null,
      contentType: null,
      elapsedMs: 0,
      errorCategory: "CONNECT_TIMEOUT",
    });
  }

  const apiRes = await callTransport(apiUrl, {
    timeoutMs: apiTimeout,
    accept: "application/json",
    referer: pageUrl,
    allowedContentTypes: ["application/json", "text/plain", "text/html", "application/xhtml+xml"],
    transport: input.transport,
  });

  if (apiRes.ok) {
    if (isHtmlShell(apiRes.bodyText, apiRes.contentType)) {
      const leftover = remainingForCandidate(input.deadlineAt);
      if (leftover >= 250 && canConsumeResolution(input.budget)) {
        return fetchHtml({
          candidate: input.candidate,
          url: pageUrl,
          budget: input.budget,
          transport: input.transport,
          deadlineAt: input.deadlineAt,
          wallCap: leftover,
          strategy: "torgi_html",
          source: "torgi",
        });
      }
      return fail({
        strategy: "torgi_api",
        source: "torgi",
        url: apiUrl,
        finalUrl: apiRes.finalUrl,
        status: apiRes.status,
        contentType: apiRes.contentType,
        elapsedMs: apiRes.elapsedMs,
        errorCategory: "HTML_SHELL",
      });
    }
    if (/json/i.test(apiRes.contentType) || apiRes.bodyText.trim().startsWith("{")) {
      const parsed = parseTorgiLotJson(apiRes.bodyText, pageUrl);
      if (!parsed) {
        return fail({
          strategy: "torgi_api",
          source: "torgi",
          url: apiUrl,
          finalUrl: apiRes.finalUrl,
          status: apiRes.status,
          contentType: apiRes.contentType,
          elapsedMs: apiRes.elapsedMs,
          errorCategory: "PARSE_ERROR",
        });
      }
      return {
        ok: true,
        candidate: applyTorgiLotToCandidate(input.candidate, parsed),
        strategy: "torgi_api",
        source: "torgi",
        url: apiUrl,
        finalUrl: apiRes.finalUrl,
        status: apiRes.status,
        contentType: apiRes.contentType,
        elapsedMs: apiRes.elapsedMs,
        bodyText: apiRes.bodyText,
        errorCategory: null,
      };
    }
    if (isHtmlShell(apiRes.bodyText, apiRes.contentType) === false && /html/i.test(apiRes.contentType)) {
      return {
        ok: true,
        candidate: input.candidate,
        strategy: "torgi_html",
        source: "torgi",
        url: apiUrl,
        finalUrl: apiRes.finalUrl,
        status: apiRes.status,
        contentType: apiRes.contentType,
        elapsedMs: apiRes.elapsedMs,
        bodyText: apiRes.bodyText,
        errorCategory: null,
      };
    }
    return fail({
      strategy: "torgi_api",
      source: "torgi",
      url: apiUrl,
      finalUrl: apiRes.finalUrl,
      status: apiRes.status,
      contentType: apiRes.contentType,
      elapsedMs: apiRes.elapsedMs,
      errorCategory: "UNSUPPORTED_CONTENT_TYPE",
    });
  }

  const category = classifyOfficialFetchFailure(apiRes, { expectJson: true });
  const leftover = remainingForCandidate(input.deadlineAt);
  const retryHtml =
    leftover >= 250 &&
    canConsumeResolution(input.budget) &&
    (category === "HTML_SHELL" || category === "UNSUPPORTED_CONTENT_TYPE");
  if (retryHtml) {
    return fetchHtml({
      candidate: input.candidate,
      url: pageUrl,
      budget: input.budget,
      transport: input.transport,
      deadlineAt: input.deadlineAt,
      wallCap: leftover,
      strategy: "torgi_html",
      source: "torgi",
    });
  }
  return fail({
    strategy: "torgi_api",
    source: "torgi",
    url: apiUrl,
    finalUrl: apiRes.finalUrl ?? apiUrl,
    status: apiRes.status ?? null,
    contentType: apiRes.contentType ?? null,
    elapsedMs: apiRes.elapsedMs ?? 0,
    errorCategory: category,
  });
}

async function fetchFedresursHtml(input: {
  candidate: LiaOiCandidate;
  url: string;
  budget: OwnIdeaRunBudget;
  transport?: OfficialDetailTransport;
  deadlineAt: number;
  wallCap: number;
}): Promise<OfficialDetailFetchResult> {
  return fetchHtml({
    ...input,
    strategy: "fedresurs_html",
    source: "fedresurs",
  });
}

async function fetchHtml(input: {
  candidate: LiaOiCandidate;
  url: string;
  budget: OwnIdeaRunBudget;
  transport?: OfficialDetailTransport;
  deadlineAt: number;
  wallCap: number;
  strategy: OfficialFetchStrategy;
  source: OfficialDetailFetchResult["source"];
}): Promise<OfficialDetailFetchResult> {
  const timeoutMs = Math.max(250, remainingForCandidate(input.deadlineAt));
  if (!canConsumeResolution(input.budget) || timeoutMs < 250 || remainingMs(input.budget) < 250) {
    return fail({
      strategy: input.strategy,
      source: input.source,
      url: input.url,
      finalUrl: input.url,
      status: null,
      contentType: null,
      elapsedMs: 0,
      errorCategory: "CONNECT_TIMEOUT",
    });
  }
  const res = await callTransport(input.url, {
    timeoutMs,
    accept: "text/html,application/xhtml+xml,application/json;q=0.8",
    transport: input.transport,
    allowedContentTypes: ["text/html", "application/xhtml+xml", "text/plain", "application/json"],
  });
  if (!res.ok) {
    return fail({
      strategy: input.strategy,
      source: input.source,
      url: input.url,
      finalUrl: res.finalUrl ?? input.url,
      status: res.status ?? null,
      contentType: res.contentType ?? null,
      elapsedMs: res.elapsedMs ?? 0,
      errorCategory: classifyOfficialFetchFailure(res),
    });
  }
  if (isHtmlShell(res.bodyText, res.contentType)) {
    return fail({
      strategy: input.strategy,
      source: input.source,
      url: input.url,
      finalUrl: res.finalUrl,
      status: res.status,
      contentType: res.contentType,
      elapsedMs: res.elapsedMs,
      errorCategory: "HTML_SHELL",
    });
  }
  return {
    ok: true,
    candidate: input.candidate,
    strategy: input.strategy,
    source: input.source,
    url: input.url,
    finalUrl: res.finalUrl,
    status: res.status,
    contentType: res.contentType,
    elapsedMs: res.elapsedMs,
    bodyText: res.bodyText,
    errorCategory: null,
  };
}
