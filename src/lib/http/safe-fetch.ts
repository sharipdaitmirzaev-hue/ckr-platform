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

export type SafeFetchOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  allowedContentTypes?: string[];
  method?: "GET" | "HEAD";
};

export type SafeFetchResult = {
  ok: true;
  url: string;
  finalUrl: string;
  status: number;
  contentType: string;
  bodyText: string;
  bytes: number;
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
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const allowedContentTypes = options.allowedContentTypes ?? [
    "text/html",
    "text/plain",
    "application/xhtml+xml",
    "application/json",
  ];

  let current = rawUrl;
  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const checked = await assertSafeUrl(current);
    if ("ok" in checked && checked.ok === false) return checked;
    const { url } = checked as { url: URL; addresses: string[] };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: options.method ?? "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,text/plain,application/json;q=0.9,*/*;q=0.1",
          "User-Agent": "CKR-LiaOI-SafeFetch/2A",
        },
        cache: "no-store",
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const loc = response.headers.get("location");
        if (!loc) {
          return {
            ok: false,
            error: "Redirect without Location",
            code: "http_error",
          };
        }
        current = new URL(loc, url).toString();
        if (hop === maxRedirects) {
          return {
            ok: false,
            error: "Too many redirects",
            code: "redirect_limit",
          };
        }
        continue;
      }

      if (!response.ok) {
        return {
          ok: false,
          error: `HTTP ${response.status}`,
          code: "http_error",
        };
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentTypeAllowed(contentType, allowedContentTypes)) {
        return {
          ok: false,
          error: `Blocked content-type: ${contentType.slice(0, 80)}`,
          code: "bad_content_type",
        };
      }

      const cl = response.headers.get("content-length");
      if (cl && Number(cl) > maxBytes) {
        return { ok: false, error: "Response too large", code: "too_large" };
      }

      const reader = response.body?.getReader();
      if (!reader) {
        return { ok: false, error: "Empty body", code: "http_error" };
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
            return { ok: false, error: "Response too large", code: "too_large" };
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
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { ok: false, error: "Timeout", code: "timeout" };
      }
      return {
        ok: false,
        error: error instanceof Error ? error.message.slice(0, 120) : "network",
        code: "network",
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return { ok: false, error: "Too many redirects", code: "redirect_limit" };
}

/** Утилита для тестов / diagnostics. */
export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".localhost")) return true;
  if (isIP(host) && isPrivateOrReservedIp(host)) return true;
  return false;
}
