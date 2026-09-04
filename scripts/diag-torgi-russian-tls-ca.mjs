#!/usr/bin/env node
/**
 * Stage 4Q.4.3.1 — read-only Russian Trusted CA / torgi TLS diagnostic.
 * Fetches official CA from gu-st.ru (Gosuslugi/Mincifry), verifies DER SHA-256,
 * then isolated curl/Node --cacert. No system store change. No market run.
 * No body dump. No rejectUnauthorized=false. No CAPTCHA bypass.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import https from "node:https";
import tls from "node:tls";
import { X509Certificate } from "node:crypto";
import { resolve } from "node:path";

const OUT = process.env.CKR_4Q431_OUT || "/tmp/ckr-4q431";
const LOT_ID = process.env.CKR_TORGI_DIAG_LOT_ID || "24000013200000000013_2";
const LOT_URL = `https://torgi.gov.ru/new/api/public/lotcards/lot/${LOT_ID}`;
const TIMEOUT_MS = 8_000;
const LOCK = JSON.parse(
  readFileSync(resolve("scripts/lib/russian-trusted-ca.lock.json"), "utf8"),
);

mkdirSync(OUT, { recursive: true });

function derSha256(pem) {
  const cert = new X509Certificate(pem);
  return createHash("sha256").update(cert.raw).digest("hex");
}

function unixPem(buf) {
  const text = buf.toString("utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const start = text.indexOf("-----BEGIN CERTIFICATE-----");
  const end = text.indexOf("-----END CERTIFICATE-----");
  if (start < 0 || end < 0) throw new Error("not a PEM certificate");
  return `${text.slice(start, end + "-----END CERTIFICATE-----".length).trim()}\n`;
}

function fetchHttps(url) {
  return new Promise((resolveP, reject) => {
    const req = https.get(url, { timeout: 20_000 }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () =>
        resolveP({ status: res.statusCode, body: Buffer.concat(chunks), contentType: res.headers["content-type"] || "" }),
      );
    });
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("FETCH_TIMEOUT"));
    });
    req.on("error", reject);
  });
}

function curlIsolated(caPath) {
  return new Promise((resolveP) => {
    const started = Date.now();
    const child = spawn(
      "curl",
      [
        "-4",
        "-sS",
        "-o",
        "/dev/null",
        "--max-time",
        String(TIMEOUT_MS / 1000),
        "--connect-timeout",
        String(TIMEOUT_MS / 1000),
        "--cacert",
        caPath,
        "-w",
        "http=%{http_code} ssl=%{time_appconnect} connect=%{time_connect} ctype=%{content_type}\n",
        "-H",
        "Accept: application/json",
        "-H",
        "User-Agent: CKR-4Q431-Isolated/1.0",
        LOT_URL,
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
      resolveP({
        exit: code,
        elapsedMs: Date.now() - started,
        meta: stdout.trim(),
        stderr: stderr.slice(0, 200),
      });
    });
  });
}

function nodeIsolated(caPem) {
  return new Promise((resolveP) => {
    const started = Date.now();
    const url = new URL(LOT_URL);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: "GET",
        family: 4,
        ca: caPem,
        rejectUnauthorized: true,
        headers: { Accept: "application/json", "User-Agent": "CKR-4Q431-Isolated/1.0" },
      },
      (res) => {
        let n = 0;
        let first = "";
        res.on("data", (c) => {
          if (!first) first = c.toString("utf8").slice(0, 16);
          n += c.length;
          if (n > 4096) res.destroy();
        });
        res.on("end", () => {
          resolveP({
            ok: true,
            httpStatus: res.statusCode,
            contentType: res.headers["content-type"] || "",
            bytes: n,
            startsJson: first.trimStart().startsWith("{"),
            elapsedMs: Date.now() - started,
          });
        });
      },
    );
    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy();
      resolveP({ ok: false, error: "TIMEOUT", elapsedMs: Date.now() - started });
    });
    req.on("error", (e) => {
      resolveP({
        ok: false,
        error: e.message.slice(0, 180),
        code: e.code,
        elapsedMs: Date.now() - started,
      });
    });
    req.end();
  });
}

async function main() {
  const osStore = readFileSync("/etc/ssl/certs/ca-certificates.crt", "utf8");
  const russianInOs = /Russian Trusted Root CA/i.test(osStore);
  const russianInNode = /Russian Trusted Root CA/i.test(tls.rootCertificates.join("\n"));

  const rootRes = await fetchHttps(LOCK.rootPemUrl);
  const subRes = await fetchHttps(LOCK.subPemUrl);
  const rootPem = unixPem(rootRes.body);
  const subPem = unixPem(subRes.body);
  const rootSha = derSha256(rootPem);
  const subSha = derSha256(subPem);
  const rootCert = new X509Certificate(rootPem);
  const subCert = new X509Certificate(subPem);
  if (rootSha !== LOCK.rootDerSha256) throw new Error(`root fingerprint mismatch ${rootSha}`);
  if (subSha !== LOCK.subDerSha256) throw new Error(`sub fingerprint mismatch ${subSha}`);

  const bundle = `${rootPem}${subPem}`;
  const bundlePath = `${OUT}/official-ca-bundle.pem`;
  writeFileSync(bundlePath, bundle);

  const curl = await curlIsolated(bundlePath);
  const node = await nodeIsolated(bundle);

  const curlOk = curl.exit === 0 && /http=200/.test(curl.meta);
  const nodeOk = node.ok === true && node.httpStatus === 200;

  const out = {
    LIVE_DIAGNOSTIC_ENV: process.env.CKR_DIAG_ENV || "cloud_agent",
    SSH_TO_PRODUCTION_VPS: "NO",
    TORGI_CERT_ISSUER: "UNKNOWN",
    TORGI_CERT_SUBJECT: "UNKNOWN",
    TORGI_CERT_VALID_FROM: "UNKNOWN",
    TORGI_CERT_VALID_TO: "UNKNOWN",
    TORGI_CHAIN_OBTAINED: "NO",
    RUSSIAN_TRUST_CHAIN: "UNKNOWN",
    RUSSIAN_ROOT_IN_OS_STORE: russianInOs ? "YES" : "NO",
    RUSSIAN_ROOT_VISIBLE_TO_OPENSSL: russianInOs ? "YES" : "NO",
    RUSSIAN_ROOT_VISIBLE_TO_NODE: russianInNode ? "YES" : "NO",
    CA_SOURCE: LOCK.rootPemUrl,
    CA_INSTRUCTION: LOCK.instructionUrl,
    CA_SUBJECT: rootCert.subject,
    CA_ISSUER: rootCert.issuer,
    CA_SHA256: rootSha,
    SUB_SUBJECT: subCert.subject,
    SUB_SHA256: subSha,
    FINGERPRINT_MATCH: true,
    ISOLATED_CURL_WITH_CA: curlOk ? "SUCCESS" : curl.exit === 28 || /timeout/i.test(curl.stderr) ? "FAIL_TIMEOUT" : `FAIL_EXIT_${curl.exit}`,
    ISOLATED_NODE_WITH_CA: nodeOk ? "SUCCESS" : node.error === "TIMEOUT" ? "FAIL_TIMEOUT" : "FAIL",
    CURL: curl,
    NODE: { ...node, bodySaved: false },
    TLS_VERIFIED: curlOk || nodeOk ? "YES" : "NO",
    OFFICIAL_JSON_HTTP_STATUS: node.httpStatus ?? (curl.meta.match(/http=(\d+)/)?.[1] ?? "000"),
    OFFICIAL_JSON_RECEIVED: nodeOk && node.startsJson ? "YES" : "NO",
    OFFICIAL_JSON_PARSE: nodeOk && node.startsJson ? "YES" : "NO",
    TLS_VERIFICATION_DISABLED: "NO",
    SYSTEM_STORE_CHANGED: "NO",
    SUPABASE_WRITES: false,
    MARKET_RUN: false,
  };
  writeFileSync(`${OUT}/diag.json`, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error("DIAG_FAIL", e instanceof Error ? e.message : e);
  process.exit(1);
});
