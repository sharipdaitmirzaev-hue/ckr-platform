/**
 * Stage 4Q.4.3 — source-specific official DETAIL transport.
 * Used only by OfficialDetailFetcher. Not a general crawler / proxy.
 *
 * IPv4-preferred address selection (torgi AAAA hangs are a known class of
 * failures). Phase-aware timeouts: connect / TLS / headers / body.
 */
import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";
import type { IncomingMessage } from "node:http";
import {
  getActiveOwnIdeaBudget,
  noteActiveExternalHttp,
} from "@/lib/ckr-own-ideas/run-budget";
import {
  assertSafeUrl,
  type SafeFetchFailure,
  type SafeFetchOptions,
  type SafeFetchResult,
} from "@/lib/http/safe-fetch";

export const OFFICIAL_IP_FAMILY_POLICY = "ipv4_preferred" as const;
export type OfficialIpFamilyPolicy = "ipv4_preferred" | "system_default";

export type OfficialAddress = { address: string; family: 4 | 6 };

export type OfficialRequestPhase = "connect" | "tls" | "headers" | "body";

export type OfficialHttpFetchOptions = SafeFetchOptions & {
  ipFamilyPolicy?: OfficialIpFamilyPolicy;
  connectTimeoutMs?: number;
  tlsTimeoutMs?: number;
  headersTimeoutMs?: number;
  bodyTimeoutMs?: number;
};

export type OfficialHopResult = (SafeFetchResult & { location?: string | null }) | SafeFetchFailure;

export type OfficialHttpFetchDeps = {
  assertSafe?: typeof assertSafeUrl;
  lookupAll?: (hostname: string) => Promise<OfficialAddress[]>;
  requestOnce?: (
    url: URL,
    address: OfficialAddress,
    opts: OfficialHttpFetchOptions,
  ) => Promise<OfficialHopResult>;
};

const DEFAULT_TIMEOUT_MS = 4_000;
const DEFAULT_MAX_BYTES = 400_000;
const DEFAULT_MAX_REDIRECTS = 3;

export function familyOfIp(ip: string): 4 | 6 | null {
  const v = isIP(ip);
  if (v === 4) return 4;
  if (v === 6) return 6;
  return null;
}

export function pickOfficialAddress(
  addresses: OfficialAddress[],
  policy: OfficialIpFamilyPolicy = OFFICIAL_IP_FAMILY_POLICY,
): OfficialAddress | null {
  if (!addresses.length) return null;
  if (policy === "ipv4_preferred") {
    return addresses.find((a) => a.family === 4) ?? addresses[0] ?? null;
  }
  return addresses[0] ?? null;
}

export function classifyTransportErrno(
  err: { message?: string; code?: string; name?: string },
  phase: OfficialRequestPhase,
  family: 4 | 6,
): SafeFetchFailure["code"] {
  const code = err.code || "";
  const msg = `${err.name || ""} ${err.message || ""} ${code}`;
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "dns_failed";
  if (code === "ECONNREFUSED" || /ECONNREFUSED/i.test(msg)) return "connect_refused";
  if (/ssl|tls|certificate|CERT_|handshake/i.test(msg) && !/timeout/i.test(msg)) {
    return "network";
  }
  if (code === "ETIMEDOUT" || code === "TIMEOUT" || /timeout|aborted/i.test(msg)) {
    if (phase === "tls") return "tls_handshake_timeout";
    if (phase === "headers") return "headers_timeout";
    if (phase === "body") return "body_timeout";
    return family === 6 ? "ipv6_connect_timeout" : "ipv4_connect_timeout";
  }
  if (phase === "tls") return "tls_handshake_timeout";
  if (phase === "connect") return family === 6 ? "ipv6_connect_timeout" : "ipv4_connect_timeout";
  return "network";
}

async function defaultLookupAll(hostname: string): Promise<OfficialAddress[]> {
  const looked = await dns.lookup(hostname, { all: true, verbatim: true });
  return looked
    .map((r) => ({
      address: r.address,
      family: (r.family === 6 ? 6 : 4) as 4 | 6,
    }))
    .filter((r) => familyOfIp(r.address) === r.family);
}

function fail(
  code: SafeFetchFailure["code"],
  error: string,
  extra: Partial<SafeFetchFailure> = {},
): SafeFetchFailure {
  return { ok: false, error, code, ...extra };
}

function contentTypeAllowed(contentType: string, allowed: string[] | undefined): boolean {
  if (!allowed || allowed.length === 0) return true;
  const base = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return allowed.some(
    (a) => base === a.toLowerCase() || base.startsWith(`${a.toLowerCase()}+`),
  );
}

export function defaultOfficialRequestOnce(
  url: URL,
  address: OfficialAddress,
  opts: OfficialHttpFetchOptions,
): Promise<OfficialHopResult> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const connectTimeoutMs = opts.connectTimeoutMs ?? timeoutMs;
  const tlsTimeoutMs = opts.tlsTimeoutMs ?? timeoutMs;
  const headersTimeoutMs = opts.headersTimeoutMs ?? timeoutMs;
  const bodyTimeoutMs = opts.bodyTimeoutMs ?? timeoutMs;
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const started = Date.now();
  const elapsed = () => Date.now() - started;
  const transport = url.protocol === "http:" ? http : https;

  return new Promise((resolve) => {
    let phase: OfficialRequestPhase = "connect";
    let settled = false;
    const done = (result: OfficialHopResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const headers: Record<string, string> = {
      Host: url.host,
      Accept:
        opts.accept || "application/json,text/html,text/plain;q=0.9,*/*;q=0.1",
      "User-Agent": "CKR-OfficialDetail/4Q43",
    };
    if (opts.referer) {
      try {
        const ref = new URL(opts.referer);
        if (ref.protocol.startsWith("http") && ref.hostname === url.hostname) {
          headers.Referer = ref.toString();
        }
      } catch {
        /* ignore */
      }
    }

    const req = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: opts.method ?? "GET",
        family: address.family,
        servername: url.hostname,
        timeout: connectTimeoutMs,
        lookup: (_host, _options, cb) => {
          cb(null, address.address, address.family);
        },
        headers,
      },
      (res: IncomingMessage) => {
        phase = "body";
        const contentType = String(res.headers["content-type"] || "");
        const status = res.statusCode ?? 0;
        const location = typeof res.headers.location === "string" ? res.headers.location : null;
        const cl = res.headers["content-length"];
        if (cl && Number(cl) > maxBytes) {
          res.resume();
          req.destroy();
          done(
            fail("too_large", "Response too large", {
              status,
              contentType,
              finalUrl: url.toString(),
              elapsedMs: elapsed(),
            }),
          );
          return;
        }

        const chunks: Buffer[] = [];
        let total = 0;
        const bodyTimer = setTimeout(() => {
          req.destroy();
          done(
            fail("body_timeout", "Body timeout", {
              status,
              contentType,
              finalUrl: url.toString(),
              elapsedMs: elapsed(),
            }),
          );
        }, bodyTimeoutMs);

        res.on("data", (chunk: Buffer) => {
          total += chunk.length;
          if (total > maxBytes) {
            clearTimeout(bodyTimer);
            res.resume();
            req.destroy();
            done(
              fail("too_large", "Response too large", {
                status,
                contentType,
                finalUrl: url.toString(),
                elapsedMs: elapsed(),
              }),
            );
            return;
          }
          chunks.push(Buffer.from(chunk));
        });
        res.on("end", () => {
          clearTimeout(bodyTimer);
          done({
            ok: true,
            url: url.toString(),
            finalUrl: url.toString(),
            status,
            contentType,
            bodyText: Buffer.concat(chunks).toString("utf8"),
            bytes: total,
            elapsedMs: elapsed(),
            location,
          });
        });
        res.on("error", (error) => {
          clearTimeout(bodyTimer);
          done(
            fail(classifyTransportErrno(error, "body", address.family), error.message.slice(0, 160), {
              finalUrl: url.toString(),
              elapsedMs: elapsed(),
            }),
          );
        });
      },
    );

    const onPhaseTimeout = () => {
      req.destroy();
      const code = classifyTransportErrno(
        { code: "TIMEOUT", message: `${phase} timeout` },
        phase,
        address.family,
      );
      done(
        fail(code, `${phase} timeout`, {
          finalUrl: url.toString(),
          elapsedMs: elapsed(),
        }),
      );
    };

    req.on("socket", (socket) => {
      socket.setTimeout(connectTimeoutMs, onPhaseTimeout);
      socket.once("connect", () => {
        phase = url.protocol === "https:" ? "tls" : "headers";
        socket.setTimeout(
          url.protocol === "https:" ? tlsTimeoutMs : headersTimeoutMs,
          onPhaseTimeout,
        );
      });
      socket.once("secureConnect", () => {
        phase = "headers";
        socket.setTimeout(headersTimeoutMs, onPhaseTimeout);
      });
    });

    req.on("timeout", onPhaseTimeout);
    req.on("error", (error) => {
      done(
        fail(classifyTransportErrno(error, phase, address.family), error.message.slice(0, 160), {
          finalUrl: url.toString(),
          elapsedMs: elapsed(),
        }),
      );
    });
    req.end();
  });
}

/**
 * One official HTTP attempt. Counts as one actual external call when ALS budget is active.
 */
export async function officialHttpFetch(
  rawUrl: string,
  options: OfficialHttpFetchOptions = {},
  deps: OfficialHttpFetchDeps = {},
): Promise<SafeFetchResult | SafeFetchFailure> {
  const ownBudget = getActiveOwnIdeaBudget();
  if (ownBudget) {
    if (!noteActiveExternalHttp("resolution")) {
      return { ok: false, error: "budget_external", code: "network" };
    }
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const allowedContentTypes = options.allowedContentTypes ?? [
    "text/html",
    "text/plain",
    "application/xhtml+xml",
    "application/json",
  ];
  const policy = options.ipFamilyPolicy ?? OFFICIAL_IP_FAMILY_POLICY;
  const lookupAll = deps.lookupAll ?? defaultLookupAll;
  const requestOnce = deps.requestOnce ?? defaultOfficialRequestOnce;
  const assertSafe = deps.assertSafe ?? assertSafeUrl;
  const started = Date.now();
  const elapsed = () => Date.now() - started;

  let current = rawUrl;
  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const checked = await assertSafe(current);
    if ("ok" in checked && checked.ok === false) {
      return { ...checked, elapsedMs: elapsed(), finalUrl: current };
    }
    const { url, addresses: safeAddrs } = checked as { url: URL; addresses: string[] };

    let looked: OfficialAddress[];
    try {
      looked = await lookupAll(url.hostname);
    } catch {
      return fail("dns_failed", "DNS lookup failed", { finalUrl: url.toString(), elapsedMs: elapsed() });
    }
    const merged = looked.length
      ? looked
      : safeAddrs
          .map((address) => {
            const family = familyOfIp(address);
            return family ? { address, family } : null;
          })
          .filter((x): x is OfficialAddress => Boolean(x));
    if (!merged.length) {
      return fail("dns_failed", "DNS returned no addresses", {
        finalUrl: url.toString(),
        elapsedMs: elapsed(),
      });
    }
    const chosen = pickOfficialAddress(merged, policy);
    if (!chosen) {
      return fail("dns_failed", "No selectable address", {
        finalUrl: url.toString(),
        elapsedMs: elapsed(),
      });
    }

    const remaining = Math.max(250, timeoutMs - elapsed());
    const hopResult = await requestOnce(url, chosen, {
      ...options,
      timeoutMs: remaining,
      connectTimeoutMs: options.connectTimeoutMs ?? remaining,
      tlsTimeoutMs: options.tlsTimeoutMs ?? remaining,
      headersTimeoutMs: options.headersTimeoutMs ?? remaining,
      bodyTimeoutMs: options.bodyTimeoutMs ?? remaining,
    });

    if (!hopResult.ok) return hopResult;
    if ([301, 302, 303, 307, 308].includes(hopResult.status)) {
      const loc = hopResult.location;
      if (!loc) {
        return fail("http_error", "Redirect without Location", {
          status: hopResult.status,
          finalUrl: hopResult.finalUrl,
          elapsedMs: elapsed(),
        });
      }
      if (hop === maxRedirects) {
        return fail("redirect_limit", "Too many redirects", {
          status: hopResult.status,
          finalUrl: hopResult.finalUrl,
          elapsedMs: elapsed(),
        });
      }
      current = new URL(loc, url).toString();
      continue;
    }

    if (!hopResult.status || hopResult.status >= 400) {
      return fail("http_error", `HTTP ${hopResult.status}`, {
        status: hopResult.status,
        contentType: hopResult.contentType,
        finalUrl: hopResult.finalUrl,
        elapsedMs: hopResult.elapsedMs,
      });
    }
    if (!contentTypeAllowed(hopResult.contentType, allowedContentTypes)) {
      return fail("bad_content_type", `Blocked content-type: ${hopResult.contentType.slice(0, 80)}`, {
        status: hopResult.status,
        contentType: hopResult.contentType,
        finalUrl: hopResult.finalUrl,
        elapsedMs: hopResult.elapsedMs,
      });
    }
    return hopResult;
  }

  return fail("redirect_limit", "Too many redirects", { elapsedMs: elapsed() });
}
