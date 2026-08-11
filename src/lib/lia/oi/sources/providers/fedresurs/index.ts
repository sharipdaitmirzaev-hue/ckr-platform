/**
 * FedresursOfficialProvider — ЕФРСБ REST readiness (fixtures without contract).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  fedresursConnectionStatus,
  fedresursStatusMessage,
  getFedresursOfficialConfig,
} from "@/lib/lia/oi/sources/providers/config";
import {
  getFedresursAccessToken,
  refreshFedresursAccessToken,
} from "@/lib/lia/oi/sources/providers/fedresurs/auth";
import { parseFedresursLotsPayload } from "@/lib/lia/oi/sources/providers/fedresurs/parse";
import type {
  OfficialProvider,
  OfficialProviderQuery,
  OfficialProviderResult,
} from "@/lib/lia/oi/sources/providers/types";

const FIXTURE_LOTS = join(
  process.cwd(),
  "src/lib/lia/oi/sources/providers/fedresurs/fixtures/lots.json",
);

function loadFixtureLots() {
  const raw = JSON.parse(readFileSync(FIXTURE_LOTS, "utf8"));
  return parseFedresursLotsPayload(raw, { dataChannel: "FIXTURE_DEMO" });
}

function filterLots(
  objects: ReturnType<typeof loadFixtureLots>,
  rawQuery: string,
  limit: number,
) {
  const q = rawQuery.toLowerCase();
  const filtered = objects.filter((o) => {
    if (!q.trim()) return true;
    if (/торг|аукцион|банкрот|актив|лот|цех|производ/.test(q)) return true;
    const hay = `${o.title} ${o.description}`.toLowerCase();
    return hay.includes(q.slice(0, 24));
  });
  return filtered.slice(0, limit);
}

async function tryLiveFedresurs(input: {
  rawQuery: string;
  limit: number;
}): Promise<OfficialProviderResult> {
  const cfg = getFedresursOfficialConfig();
  let auth = await getFedresursAccessToken({
    allowLive: true,
    useMock: false,
  });
  if (auth.error === "auth_http_401" || auth.error === "auth_http_403") {
    auth = await refreshFedresursAccessToken({
      allowLive: true,
      useMock: false,
    });
  }
  if (!auth.token) {
    return {
      providerId: "fedresurs",
      label: "ЕФРСБ (официальный API)",
      connectionStatus: "UNAVAILABLE",
      transport: "http_api",
      objects: [],
      error: auth.error || "auth_failed",
      statusMessage: "API временно недоступен",
    };
  }

  try {
    const url = new URL(
      `${cfg.baseUrl.replace(/\/$/, "")}/v1/trades`,
    );
    url.searchParams.set("limit", String(input.limit));
    if (input.rawQuery) url.searchParams.set("query", input.rawQuery.slice(0, 120));

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    let res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
        "User-Agent": "CKR-LIA-OI/2C.3",
      },
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (res.status === 401) {
      const refreshed = await refreshFedresursAccessToken({
        allowLive: true,
        useMock: false,
      });
      if (!refreshed.token) {
        return {
          providerId: "fedresurs",
          label: "ЕФРСБ (официальный API)",
          connectionStatus: "UNAVAILABLE",
          transport: "http_api",
          objects: [],
          error: "token_refresh_failed",
          statusMessage: "API временно недоступен",
        };
      }
      const ctrl2 = new AbortController();
      const timer2 = setTimeout(() => ctrl2.abort(), 12_000);
      res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${refreshed.token}`,
          Accept: "application/json",
          "User-Agent": "CKR-LIA-OI/2C.3",
        },
        signal: ctrl2.signal,
      });
      clearTimeout(timer2);
    }

    if (!res.ok) {
      return {
        providerId: "fedresurs",
        label: "ЕФРСБ (официальный API)",
        connectionStatus: "UNAVAILABLE",
        transport: "http_api",
        objects: [],
        error: `fedresurs_http_${res.status}`,
        statusMessage: "API временно недоступен",
      };
    }

    const json = await res.json();
    const objects = filterLots(
      parseFedresursLotsPayload(json, { dataChannel: "OFFICIAL_API" }),
      input.rawQuery,
      input.limit,
    );
    return {
      providerId: "fedresurs",
      label: "ЕФРСБ (официальный API)",
      connectionStatus: "CONNECTED",
      transport: "http_api",
      objects,
      error: null,
      statusMessage: "CONNECTED · live REST",
    };
  } catch {
    return {
      providerId: "fedresurs",
      label: "ЕФРСБ (официальный API)",
      connectionStatus: "UNAVAILABLE",
      transport: "http_api",
      objects: [],
      error: "fedresurs_network_or_timeout",
      statusMessage: "API временно недоступен",
    };
  }
}

export const fedresursOfficialProvider: OfficialProvider = {
  id: "fedresurs",
  label: "ЕФРСБ (официальный API)",
  getConnectionStatus: fedresursConnectionStatus,
  getStatusMessage: fedresursStatusMessage,
  async search(query: OfficialProviderQuery): Promise<OfficialProviderResult> {
    const status = fedresursConnectionStatus();

    if (query.allowLive && status === "CONNECTED" && !query.useFixtures) {
      return tryLiveFedresurs({
        rawQuery: query.rawQuery,
        limit: query.limit,
      });
    }

    // Mock auth + fixture lots (official JSON shape)
    await getFedresursAccessToken({ allowLive: false, useMock: true });
    const objects = filterLots(loadFixtureLots(), query.rawQuery, query.limit);

    return {
      providerId: "fedresurs",
      label: "ЕФРСБ (официальный API)",
      connectionStatus: status === "CONNECTED" ? "CONNECTED" : "NOT_CONFIGURED",
      transport: "fixture",
      objects,
      error: null,
      statusMessage:
        status === "NOT_CONFIGURED"
          ? "credentials не настроены"
          : fedresursStatusMessage(),
    };
  },
};

export function loadFedresursFixtureObjects() {
  return loadFixtureLots();
}
