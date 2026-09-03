/**
 * SSRF-safe fetch для untrusted URL (страницы из поисковой выдачи).
 *
 * - только http/https
 * - блок localhost / private IP / link-local / metadata
 * - DNS resolve + проверка IP (базовая защита от rebinding)
 * - timeout, max size, content-type, limit redirects
 *
 * Любой полученный HTML/text считать untrusted content.
 */

import dns from "node:dns/promises";
import { isIP } from "node:net";
import {
  getActiveOwnIdeaBudget,
  noteActiveExternalHttp,
  requestTimeoutMs,
} from "@/lib/ckr-own-ideas/run-budget";

export type SafeFetchOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  allowedContentTypes?: string[];
  method?: "GET" | "HEAD";
  /** Optional Accept; not a scraper UA switch. */
  accept?: string;
  /** Same-origin Referer only (official SPA → official API). */
  referer?: string;
};

export type SafeFetchResult = {
  ok: true;
  url: string;
  finalUrl: string;
  status: number;
  contentType: string;
  bodyText: string;
  bytes: number;
  elapsedMs: number;
};

export type SafeFetchFailure = {
  ok: false;
  error: string;
  code:
    | "invalid_url"
    | "blocked_host"
    | "blocked_ip"
    | "dns_failed"
    | "timeout"
    | "too_large"
    | "bad_content_type"
    | "http_error"
    | "redirect_limit"
    | "network";
  status?: number | null;
  contentType?: string | null;
  finalUrl?: string | null;
  elapsedMs?: number;
};

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_BYTES = 512_000;
const DEFAULT_MAX_REDIRECTS = 3;

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
]);

export function isPrivateOrReservedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast/reserved
    return false;
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === "::" || normalized === "::1") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
    if (normalized.startsWith("fe80")) return true; // link-local
    if (normalized.startsWith("ff")) return true; // multicast
    // IPv4-mapped
    if (normalized.startsWith("::ffff:")) {
      const v4 = normalized.slice("::ffff:".length);
      if (isIP(v4) === 4) return isPrivateOrReservedIp(v4);
    }
    return false;
  }
  return true;
}

export async function assertSafeUrl(
  rawUrl: string,
): Promise<{ url: URL; addresses: string[] } | SafeFetchFailure> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, error: "Invalid URL", code: "invalid_url" };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Only http/https allowed", code: "invalid_url" };
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || BLOCKED_HOSTS.has(host) || host.endsWith(".localhost")) {
    return { ok: false, error: "Blocked host", code: "blocked_host" };
  }
  if (host === "0.0.0.0" || host.startsWith("127.")) {
    return { ok: false, error: "Blocked host", code: "blocked_host" };
  }

  // Literal IP in hostname
  if (isIP(host)) {
    if (isPrivateOrReservedIp(host)) {
      return { ok: false, error: "Blocked IP", code: "blocked_ip" };
    }
    return { url, addresses: [host] };
  }

  let addresses: string[];
  try {
    const looked = await dns.lookup(host, { all: true, verbatim: true });
    addresses = looked.map((r) => r.address);
  } catch {
    return { ok: false, error: "DNS lookup failed", code: "dns_failed" };
  }

  if (!addresses.length) {
    return { ok: false, error: "DNS returned no addresses", code: "dns_failed" };
  }

  for (const addr of addresses) {
    if (isPrivateOrReservedIp(addr)) {
      return {
        ok: false,
        error: "Resolved to private/reserved IP",
        code: "blocked_ip",
      };
    }
  }

  return { url, addresses };
}

function contentTypeAllowed(
  contentType: string,
  allowed: string[] | undefined,
): boolean {
  if (!allowed || allowed.length === 0) return true;
  const base = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return allowed.some(
    (a) => base === a.toLowerCase() || base.startsWith(`${a.toLowerCase()}+`),
  );
}

/**
 * Безопасный GET/HEAD к untrusted URL.
 * Не передавать HTML в системный prompt без санитизации/ограничения.
 */
export async function safeFetch(
  rawUrl: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult | SafeFetchFailure> {
  const ownBudget = getActiveOwnIdeaBudget();
  if (ownBudget) {
    if (!noteActiveExternalHttp("resolution")) {
      return { ok: false, error: "budget_external", code: "network" };
    }
  }
  const timeoutMs = ownBudget
    ? requestTimeoutMs(ownBudget, options.timeoutMs ?? DEFAULT_TIMEOUT_MS, "resolution")
    : options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const allowedContentTypes = options.allowedContentTypes ?? [
    "text/html",
    "text/plain",
    "application/xhtml+xml",
    "application/json",
  ];
  const started = Date.now();
  const elapsed = () => Date.now() - started;
  const headers: Record<string, string> = {
    Accept:
      options.accept ||
      "text/html,text/plain,application/json;q=0.9,*/*;q=0.1",
    "User-Agent": "CKR-LiaOI-SafeFetch/2A",
  };
  if (options.referer) {
    try {
      const target = new URL(rawUrl);
      const ref = new URL(options.referer);
      if (ref.protocol.startsWith("http") && ref.hostname === target.hostname) {
        headers.Referer = ref.toString();
      }
    } catch {
      /* ignore invalid referer */
    }
  }

  let current = rawUrl;
  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const checked = await assertSafeUrl(current);
    if ("ok" in checked && checked.ok === false) {
      return { ...checked, elapsedMs: elapsed(), finalUrl: current };
    }
    const { url } = checked as { url: URL; addresses: string[] };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: options.method ?? "GET",
        redirect: "manual",
        signal: controller.signal,
        headers,
        cache: "no-store",
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const loc = response.headers.get("location");
        if (!loc) {
          return {
            ok: false,
            error: "Redirect without Location",
            code: "http_error",
            status: response.status,
            finalUrl: url.toString(),
            elapsedMs: elapsed(),
          };
        }
        current = new URL(loc, url).toString();
        if (hop === maxRedirects) {
          return {
            ok: false,
            error: "Too many redirects",
            code: "redirect_limit",
            status: response.status,
            finalUrl: url.toString(),
            elapsedMs: elapsed(),
          };
        }
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!response.ok) {
        return {
          ok: false,
          error: `HTTP ${response.status}`,
          code: "http_error",
          status: response.status,
          contentType,
          finalUrl: url.toString(),
          elapsedMs: elapsed(),
        };
      }

      if (!contentTypeAllowed(contentType, allowedContentTypes)) {
        return {
          ok: false,
          error: `Blocked content-type: ${contentType.slice(0, 80)}`,
          code: "bad_content_type",
          status: response.status,
          contentType,
          finalUrl: url.toString(),
          elapsedMs: elapsed(),
        };
      }

      const cl = response.headers.get("content-length");
      if (cl && Number(cl) > maxBytes) {
        return {
          ok: false,
          error: "Response too large",
          code: "too_large",
          status: response.status,
          contentType,
          finalUrl: url.toString(),
          elapsedMs: elapsed(),
        };
      }

      const reader = response.body?.getReader();
      if (!reader) {
        return {
          ok: false,
          error: "Empty body",
          code: "http_error",
          status: response.status,
          contentType,
          finalUrl: url.toString(),
          elapsedMs: elapsed(),
        };
      }

      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          total += value.byteLength;
          if (total > maxBytes) {
            try {
              await reader.cancel();
            } catch {
              /* ignore */
            }
            return {
              ok: false,
              error: "Response too large",
              code: "too_large",
              status: response.status,
              contentType,
              finalUrl: url.toString(),
              elapsedMs: elapsed(),
            };
          }
          chunks.push(value);
        }
      }

      const body = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString(
        "utf8",
      );

      return {
        ok: true,
        url: rawUrl,
        finalUrl: url.toString(),
        status: response.status,
        contentType,
        bodyText: body,
        bytes: total,
        elapsedMs: elapsed(),
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message.slice(0, 160) : "network";
      const tls = /ssl|tls|handshake|certificate|CERT/i.test(msg);
      if (error instanceof Error && error.name === "AbortError") {
        return {
          ok: false,
          error: tls ? "TLS handshake timeout" : "Timeout",
          code: "timeout",
          finalUrl: url.toString(),
          elapsedMs: elapsed(),
        };
      }
      return {
        ok: false,
        error: msg,
        code: "network",
        finalUrl: url.toString(),
        elapsedMs: elapsed(),
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    ok: false,
    error: "Too many redirects",
    code: "redirect_limit",
    elapsedMs: elapsed(),
  };
}

/** Утилита для тестов / diagnostics. */
export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".localhost")) return true;
  if (isIP(host) && isPrivateOrReservedIp(host)) return true;
  return false;
}
