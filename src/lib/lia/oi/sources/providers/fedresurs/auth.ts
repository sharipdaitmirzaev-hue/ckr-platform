/**
 * Fedresurs JWT login + refresh (mockable; live only with credentials).
 * Secrets never logged or returned to callers beyond opaque token handle.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getFedresursOfficialConfig,
  readFedresursCredentials,
} from "@/lib/lia/oi/sources/providers/config";

type TokenState = {
  accessToken: string;
  expiresAtMs: number;
};

let cached: TokenState | null = null;

const FIXTURE_AUTH = join(
  process.cwd(),
  "src/lib/lia/oi/sources/providers/fedresurs/fixtures/auth-token.json",
);

export function resetFedresursTokenCacheForTests(): void {
  cached = null;
}

function loadFixtureToken(): TokenState {
  const raw = JSON.parse(readFileSync(FIXTURE_AUTH, "utf8")) as {
    jwt: string;
    expiresIn: number;
  };
  return {
    accessToken: raw.jwt,
    expiresAtMs: Date.now() + (raw.expiresIn || 3600) * 1000,
  };
}

/**
 * Obtain JWT. useMock=true → fixture auth (no network).
 * Live path: POST /v1/auth (shape may vary by contract) then cache/refresh.
 */
export async function getFedresursAccessToken(options: {
  allowLive: boolean;
  useMock: boolean;
}): Promise<{ token: string; fromMock: boolean; error?: string }> {
  if (options.useMock || !options.allowLive) {
    const t = loadFixtureToken();
    cached = t;
    return { token: t.accessToken, fromMock: true };
  }

  if (cached && Date.now() < cached.expiresAtMs - 60_000) {
    return { token: cached.accessToken, fromMock: false };
  }

  const creds = readFedresursCredentials();
  const cfg = getFedresursOfficialConfig();
  if (!creds) {
    return { token: "", fromMock: false, error: "not_configured" };
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/v1/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "CKR-LIA-OI/2C.3",
      },
      body: JSON.stringify({
        login: creds.login,
        password: creds.password,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      cached = null;
      return { token: "", fromMock: false, error: `auth_http_${res.status}` };
    }
    const json = (await res.json()) as {
      jwt?: string;
      access_token?: string;
      token?: string;
      expiresIn?: number;
      expires_in?: number;
    };
    const token = json.jwt || json.access_token || json.token || "";
    if (!token) {
      return { token: "", fromMock: false, error: "auth_empty_token" };
    }
    const ttl = (json.expiresIn ?? json.expires_in ?? 3600) * 1000;
    cached = { accessToken: token, expiresAtMs: Date.now() + ttl };
    return { token, fromMock: false };
  } catch {
    cached = null;
    return { token: "", fromMock: false, error: "auth_network_or_timeout" };
  }
}

/** Force refresh (clears cache then re-auth). */
export async function refreshFedresursAccessToken(options: {
  allowLive: boolean;
  useMock: boolean;
}): Promise<{ token: string; fromMock: boolean; error?: string }> {
  cached = null;
  return getFedresursAccessToken(options);
}
