#!/usr/bin/env node
/**
 * Stage 4Q.4.3 — read-only torgi.gov.ru connectivity diagnostic.
 * No Supabase writes. No findNewOwnIdeasAction. No body dump. No CAPTCHA bypass.
 */
import dns from "node:dns/promises";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import { spawn } from "node:child_process";

const HOST = "torgi.gov.ru";
const PORT = 443;
const TIMEOUT_MS = 4_000;
const LOT_ID = process.env.CKR_TORGI_DIAG_LOT_ID || "24000013200000000013_2";
const API_PATH = `/new/api/public/lotcards/lot/${LOT_ID}`;
const NEW_PATH = "/new/";
const ENV_LABEL = process.env.CKR_DIAG_ENV || "cloud_agent";

function nowMs() {
  return Date.now();
}

function timed(ms, label) {
  return new Promise((_, reject) => {
    const t = setTimeout(() => {
      const err = new Error(`${label}_TIMEOUT`);
      err.code = "TIMEOUT";
      reject(err);
    }, ms);
    t.unref?.();
  });
}

async function race(promise, ms, label) {
  const started = nowMs();
  try {
    const value = await Promise.race([promise, timed(ms, label)]);
    return { ok: true, elapsedMs: nowMs() - started, value };
  } catch (e) {
    return {
      ok: false,
      elapsedMs: nowMs() - started,
      error: e instanceof Error ? e.message.slice(0, 160) : "error",
      code: e && typeof e === "object" && "code" in e ? e.code : undefined,
    };
  }
}

async function resolveDns() {
  const started = nowMs();
  const [a, aaaa] = await Promise.allSettled([
    dns.resolve4(HOST),
    dns.resolve6(HOST),
  ]);
  const lookup = await dns.lookup(HOST, { all: true, verbatim: true }).catch((e) => e);
  return {
    elapsedMs: nowMs() - started,
    A: a.status === "fulfilled" ? a.value : [],
    AAAA: aaaa.status === "fulfilled" ? aaaa.value : [],
    A_ERROR: a.status === "rejected" ? String(a.reason?.message || a.reason).slice(0, 120) : null,
    AAAA_ERROR: aaaa.status === "rejected" ? String(aaaa.reason?.message || aaaa.reason).slice(0, 120) : null,
    LOOKUP_ORDER: Array.isArray(lookup)
      ? lookup.map((r) => ({ family: r.family, address: r.address }))
      : { error: String(lookup?.message || lookup).slice(0, 120) },
    AUTO_SELECT_FAMILY: net.getDefaultAutoSelectFamily?.() ?? null,
    AUTO_SELECT_FAMILY_ATTEMPTTIMEOUT: net.getDefaultAutoSelectFamilyAttemptTimeout?.() ?? null,
  };
}

function tcpConnect(host, family) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port: PORT, family, autoSelectFamily: false });
    const onErr = (e) => {
      socket.destroy();
      reject(e);
    };
    socket.once("connect", () => {
      const remote = `${socket.remoteAddress}`;
      socket.end();
      socket.destroy();
      resolve({ remote });
    });
    socket.once("error", onErr);
    socket.setTimeout(TIMEOUT_MS, () => {
      socket.destroy();
      const err = new Error("TCP_TIMEOUT");
      err.code = "TIMEOUT";
      reject(err);
    });
  });
}

function tlsHandshake(host, family, servername = HOST) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host,
      port: PORT,
      family,
      servername,
      autoSelectFamily: false,
      rejectUnauthorized: true,
    });
    const onErr = (e) => {
      socket.destroy();
      reject(e);
    };
    socket.once("secureConnect", () => {
      const proto = socket.getProtocol();
      const alpn = socket.alpnProtocol;
      socket.end();
      socket.destroy();
      resolve({ proto, alpn, authorized: socket.authorized });
    });
    socket.once("error", onErr);
    socket.setTimeout(TIMEOUT_MS, () => {
      socket.destroy();
      const err = new Error("TLS_TIMEOUT");
      err.code = "TIMEOUT";
      reject(err);
    });
  });
}

function curlOnce(args) {
  return new Promise((resolve) => {
    const started = nowMs();
    const child = spawn(
      "curl",
      [
        "-sS",
        "-o",
        "/dev/null",
        "-D",
        "-",
        "--max-time",
        String(TIMEOUT_MS / 1000),
        "--connect-timeout",
        String(TIMEOUT_MS / 1000),
        "-w",
        "\n__META__ http=%{http_code} ttfb=%{time_starttransfer} total=%{time_total} ip=%{remote_ip} ctype=%{content_type}\n",
        "-H",
        "Accept: application/json,text/html;q=0.8",
        "-H",
        "User-Agent: CKR-4Q43-Diag/1.0",
        ...args,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString("utf8");
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString("utf8");
    });
    child.on("close", (code) => {
      const metaLine = stdout.split("\n").find((l) => l.startsWith("__META__")) || "";
      const statusLine = stdout.split("\n").find((l) => /^HTTP\//i.test(l)) || "";
      resolve({
        exit: code,
        elapsedMs: nowMs() - started,
        meta: metaLine.replace("__META__ ", "").trim(),
        statusLine: statusLine.slice(0, 80),
        stderr: stderr.slice(0, 200),
      });
    });
  });
}

function httpsGetFamily(url, family) {
  return new Promise((resolve, reject) => {
    const started = nowMs();
    const req = https.request(url, {
      method: "GET",
      family,
      timeout: TIMEOUT_MS,
      headers: {
        Accept: "application/json,text/html;q=0.8",
        "User-Agent": "CKR-4Q43-Diag/1.0",
      },
    }, (res) => {
      const ct = res.headers["content-type"] || "";
      let bytes = 0;
      let first = "";
      res.on("data", (chunk) => {
        if (bytes === 0) first = chunk.toString("utf8").slice(0, 16);
        bytes += chunk.length;
        if (bytes > 4096) res.destroy();
      });
      res.on("end", () => {
        resolve({
          ok: true,
          elapsedMs: nowMs() - started,
          httpStatus: res.statusCode ?? null,
          contentType: String(ct).slice(0, 80),
          bytesRead: bytes,
          startsWithJson: first.trimStart().startsWith("{"),
          parseAttempted: true,
          bodySaved: false,
        });
      });
      res.on("error", reject);
    });
    req.on("timeout", () => {
      req.destroy();
      const err = new Error("HTTPS_TIMEOUT");
      err.code = "TIMEOUT";
      reject(err);
    });
    req.on("error", reject);
    req.end();
  });
}

async function nodeFetchOnce(url) {
  const started = nowMs();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: ctrl.signal,
      headers: {
        Accept: "application/json,text/html;q=0.8",
        "User-Agent": "CKR-4Q43-Diag/1.0",
      },
      cache: "no-store",
    });
    const ct = res.headers.get("content-type") || "";
    const reader = res.body?.getReader?.();
    let bytes = 0;
    let first = "";
    if (reader) {
      const { value } = await reader.read();
      if (value) {
        bytes += value.byteLength;
        first = Buffer.from(value.subarray(0, 16)).toString("utf8");
      }
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
    }
    return {
      ok: true,
      elapsedMs: nowMs() - started,
      httpStatus: res.status,
      contentType: ct.slice(0, 80),
      bytesRead: bytes,
      startsWithJson: first.trimStart().startsWith("{"),
      parseAttempted: true,
      bodySaved: false,
    };
  } catch (e) {
    return {
      ok: false,
      elapsedMs: nowMs() - started,
      error: e instanceof Error ? `${e.name}:${e.message}`.slice(0, 180) : "error",
      cause: e && typeof e === "object" && "cause" in e
        ? String(e.cause?.code || e.cause?.message || "").slice(0, 120)
        : undefined,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const dnsInfo = await resolveDns();
  const ipv4 = dnsInfo.A[0] || null;
  const ipv6 = dnsInfo.AAAA[0] || null;

  const tcp4 = ipv4 ? await race(tcpConnect(ipv4, 4), TIMEOUT_MS, "TCP4") : { ok: false, error: "NO_A" };
  const tcp6 = ipv6 ? await race(tcpConnect(ipv6, 6), TIMEOUT_MS, "TCP6") : { ok: false, error: "NO_AAAA" };
  const tls4 = ipv4 ? await race(tlsHandshake(ipv4, 4), TIMEOUT_MS, "TLS4") : { ok: false, error: "NO_A" };
  const tls6 = ipv6 ? await race(tlsHandshake(ipv6, 6), TIMEOUT_MS, "TLS6") : { ok: false, error: "NO_AAAA" };

  const apiUrl = `https://${HOST}${API_PATH}`;
  const newUrl = `https://${HOST}${NEW_PATH}`;

  const curl4 = await curlOnce(["-4", apiUrl]);
  const curl6 = ipv6 ? await curlOnce(["-6", apiUrl]) : { ok: false, error: "NO_AAAA" };
  const curl4New = await curlOnce(["-4", newUrl]);

  const nodeDefault = await nodeFetchOnce(apiUrl);
  const nodeIpv4Raw = await race(httpsGetFamily(apiUrl, 4), TIMEOUT_MS + 250, "NODE4");
  const nodeIpv4 = nodeIpv4Raw.ok ? nodeIpv4Raw.value : {
    ok: false,
    elapsedMs: nodeIpv4Raw.elapsedMs,
    error: nodeIpv4Raw.error,
  };

  const officialJsonIpv4 =
    nodeIpv4.ok && (nodeIpv4.httpStatus === 200 || nodeIpv4.startsWithJson)
      ? "SUCCESS"
      : curl4.meta && /http=200/.test(curl4.meta)
        ? "CURL_OK_NODE_FAIL"
        : "FAIL";

  const out = {
    LIVE_DIAGNOSTIC_ENV: ENV_LABEL,
    HOST,
    LOT_ID,
    API_PATH,
    TIMEOUT_MS,
    NODE: process.version,
    DNS_A: dnsInfo.A.length ? "YES" : "NO",
    DNS_AAAA: dnsInfo.AAAA.length ? "YES" : "NO",
    DNS_A_ADDRS: dnsInfo.A,
    DNS_AAAA_ADDRS: dnsInfo.AAAA,
    DNS_LOOKUP_ORDER: dnsInfo.LOOKUP_ORDER,
    AUTO_SELECT_FAMILY: dnsInfo.AUTO_SELECT_FAMILY,
    AUTO_SELECT_FAMILY_ATTEMPTTIMEOUT: dnsInfo.AUTO_SELECT_FAMILY_ATTEMPTTIMEOUT,
    TCP_IPV4: tcp4.ok ? "YES" : "NO",
    TCP_IPV6: tcp6.ok ? "YES" : "NO",
    TLS_IPV4: tls4.ok ? "YES" : "NO",
    TLS_IPV6: tls6.ok ? "YES" : "NO",
    TCP_IPV4_MS: tcp4.elapsedMs,
    TCP_IPV6_MS: tcp6.elapsedMs,
    TLS_IPV4_MS: tls4.elapsedMs,
    TLS_IPV6_MS: tls6.elapsedMs,
    TCP_IPV4_ERR: tcp4.ok ? null : tcp4.error,
    TCP_IPV6_ERR: tcp6.ok ? null : tcp6.error,
    TLS_IPV4_ERR: tls4.ok ? null : tls4.error,
    TLS_IPV6_ERR: tls6.ok ? null : tls6.error,
    CURL_IPV4: curl4,
    CURL_IPV6: curl6,
    CURL_IPV4_NEW: curl4New,
    NODE_DEFAULT: nodeDefault,
    NODE_IPV4: nodeIpv4,
    OFFICIAL_JSON_IPV4: officialJsonIpv4,
    BODY_SAVED: false,
    CAPTCHA_BYPASS: false,
    SUPABASE_WRITES: false,
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error("DIAG_FAIL", e instanceof Error ? e.message : e);
  process.exit(1);
});
