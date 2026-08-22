/**
 * ProcurementOfficialProvider — EIS SOAP/XML readiness (fixtures without token).
 * Never performs live HTTP without LIA_EIS_TOKEN.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  eisConnectionStatus,
  eisStatusMessage,
  getEisOfficialConfig,
  readEisToken,
} from "@/lib/lia/oi/sources/providers/config";
import { parseEisNoticeXml } from "@/lib/lia/oi/sources/providers/eis/parse";
import type {
  OfficialProvider,
  OfficialProviderQuery,
  OfficialProviderResult,
} from "@/lib/lia/oi/sources/providers/types";

const FIXTURE_PATH = join(
  process.cwd(),
  "src/lib/lia/oi/sources/providers/eis/fixtures/notice-ep.xml",
);

function loadFixtureXml(): string {
  return readFileSync(FIXTURE_PATH, "utf8");
}

function filterByQuery(
  objects: ReturnType<typeof parseEisNoticeXml>,
  rawQuery: string,
  limit: number,
) {
  const q = rawQuery.toLowerCase();
  const filtered = objects.filter((o) => {
    if (!q.trim()) return true;
    const hay = `${o.title} ${o.description} ${o.subject || ""} ${o.region || ""}`.toLowerCase();
    if (/вод|напит|пищев|продукт|закупк|тендер/.test(q)) {
      return /вод|напит|пищев|продукт|упаков|закупк/.test(hay);
    }
    return true;
  });
  return filtered.slice(0, limit);
}

/**
 * Live SOAP path skeleton — only called when token present + allowLive.
 * On any failure returns null so adapters fall back to Serper/fixtures.
 */
async function tryLiveEisSoap(input: {
  endpoint: string;
  token: string;
  rawQuery: string;
  limit: number;
}): Promise<OfficialProviderResult | null> {
  // Soft-guard: do not hit production EIS from CI/demo without explicit enable.
  // When token exists, attempt a minimal POST; failures → UNAVAILABLE (no throw).
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://zakupki.gov.ru/eisws/getDocsIP">
  <soapenv:Header/>
  <soapenv:Body>
    <ws:getDocsByOrgRegion>
      <token>${input.token.replace(/[<>&]/g, "")}</token>
      <orgRegion>00</orgRegion>
      <subsystemType>PRIZ</subsystemType>
      <documentType>epNotificationEF</documentType>
    </ws:getDocsByOrgRegion>
  </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    const res = await fetch(input.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "",
        "User-Agent": "CKR-LIA-OI/2C.3",
      },
      body,
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      return {
        providerId: "eis",
        label: "ЕИС (официальный API)",
        connectionStatus: "UNAVAILABLE",
        transport: "http_api",
        objects: [],
        error: `eis_http_${res.status}`,
        statusMessage: "API временно недоступен",
      };
    }
    const xml = await res.text();
    const objects = filterByQuery(
      parseEisNoticeXml(xml, { dataChannel: "OFFICIAL_API" }),
      input.rawQuery,
      input.limit,
    );
    return {
      providerId: "eis",
      label: "ЕИС (официальный API)",
      connectionStatus: "CONNECTED",
      transport: "http_api",
      objects,
      error: null,
      statusMessage: "CONNECTED · live SOAP",
    };
  } catch {
    return {
      providerId: "eis",
      label: "ЕИС (официальный API)",
      connectionStatus: "UNAVAILABLE",
      transport: "http_api",
      objects: [],
      error: "eis_network_or_timeout",
      statusMessage: "API временно недоступен",
    };
  }
}

export const procurementOfficialProvider: OfficialProvider = {
  id: "eis",
  label: "ЕИС (официальный API)",
  getConnectionStatus: eisConnectionStatus,
  getStatusMessage: eisStatusMessage,
  async search(query: OfficialProviderQuery): Promise<OfficialProviderResult> {
    const cfg = getEisOfficialConfig();
    const status = eisConnectionStatus();

    if (query.allowLive && status === "CONNECTED" && !query.useFixtures) {
      const token = readEisToken();
      if (token) {
        const live = await tryLiveEisSoap({
          endpoint: cfg.endpoint,
          token,
          rawQuery: query.rawQuery,
          limit: query.limit,
        });
        if (live) return live;
      }
    }

    // Fixtures of official XML format — no live call
    const xml = loadFixtureXml();
    const objects = filterByQuery(
      parseEisNoticeXml(xml, { dataChannel: "FIXTURE_DEMO" }),
      query.rawQuery,
      query.limit,
    );

    return {
      providerId: "eis",
      label: "ЕИС (официальный API)",
      connectionStatus: status === "CONNECTED" ? "CONNECTED" : "NOT_CONFIGURED",
      transport: "fixture",
      objects,
      error: null,
      statusMessage:
        status === "NOT_CONFIGURED"
          ? "credentials не настроены"
          : eisStatusMessage(),
    };
  },
};

/** Test helper: parse fixture XML only. */
export function loadEisFixtureObjects() {
  return parseEisNoticeXml(loadFixtureXml(), { dataChannel: "FIXTURE_DEMO" });
}
