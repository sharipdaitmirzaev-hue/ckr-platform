/**
 * Staging target guard — never allow production writes/migrations/E2E.
 * No secret values are logged.
 */

export const CKR_PRODUCTION_PROJECT_REF = "qsnbkhzewqlutdznrppl";
export const CKR_STAGING_PROJECT_REF = "ymxonxfmvnqexgalwhmn";
export const CKR_STAGING_PROJECT_NAME = "ckr-platform-staging";
export const CKR_PRODUCTION_HOSTNAMES = [
  "ckr-center.ru",
  "www.ckr-center.ru",
  `${CKR_PRODUCTION_PROJECT_REF}.supabase.co`,
  `db.${CKR_PRODUCTION_PROJECT_REF}.supabase.co`,
];

export const CKR_STAGING_SEED_MARKER = "E2E_CKR_STAGING";

export type StagingGuardEnv = Record<string, string | undefined>;

export type StagingTarget = {
  environment: "staging";
  projectRef: string;
  urlHost: string;
};

export class CkrStagingGuardError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "CkrStagingGuardError";
    this.code = code;
  }
}

function hostnameOf(urlRaw: string): string {
  const trimmed = urlRaw.trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed).hostname.toLowerCase();
  } catch {
    return trimmed.toLowerCase().replace(/^https?:\/\//, "").split("/")[0] ?? "";
  }
}

export function extractProjectRefFromSupabaseUrl(urlRaw: string): string | null {
  const host = hostnameOf(urlRaw);
  const m = host.match(/^(?:db\.)?([a-z0-9]{20})\.supabase\.co$/i);
  return m?.[1] ?? null;
}

export function isProductionHostname(host: string): boolean {
  const h = host.toLowerCase();
  if (CKR_PRODUCTION_HOSTNAMES.includes(h)) return true;
  if (h.includes("ckr-center.ru")) return true;
  if (h.includes(CKR_PRODUCTION_PROJECT_REF)) return true;
  return false;
}

export function isProductionProjectRef(ref: string | null | undefined): boolean {
  return (ref || "").trim().toLowerCase() === CKR_PRODUCTION_PROJECT_REF;
}

export function assertCkrStagingTarget(env: StagingGuardEnv = process.env): StagingTarget {
  const environment = (env.CKR_ENVIRONMENT || "").trim();
  if (environment !== "staging") {
    throw new CkrStagingGuardError(
      "CKR_ENVIRONMENT_NOT_STAGING",
      "CKR_ENVIRONMENT must be exactly 'staging' for live staging work.",
    );
  }

  if ((env.CKR_ALLOW_STAGING_E2E || "").trim() !== "YES") {
    throw new CkrStagingGuardError(
      "STAGING_E2E_NOT_ALLOWED",
      "CKR_ALLOW_STAGING_E2E must be YES for destructive staging tools.",
    );
  }

  if ((env.CKR_E2E_ALLOW_PRODUCTION || "").trim() === "1") {
    throw new CkrStagingGuardError(
      "PRODUCTION_E2E_FORBIDDEN",
      "CKR_E2E_ALLOW_PRODUCTION is forbidden. Use isolated staging only.",
    );
  }

  const url =
    (env.CKR_STAGING_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  if (!url) {
    throw new CkrStagingGuardError(
      "STAGING_URL_MISSING",
      "CKR_STAGING_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required.",
    );
  }

  const urlHost = hostnameOf(url);
  if (isProductionHostname(urlHost)) {
    throw new CkrStagingGuardError(
      "PRODUCTION_URL_REFUSED",
      "Supabase URL points at production. STOP.",
    );
  }

  const urlRef = extractProjectRefFromSupabaseUrl(url);
  const declaredRef = (
    env.CKR_STAGING_PROJECT_REF ||
    env.SUPABASE_PROJECT_REF ||
    ""
  ).trim();
  const projectRef = declaredRef || urlRef || "";

  if (!projectRef) {
    throw new CkrStagingGuardError(
      "STAGING_REF_MISSING",
      "CKR_STAGING_PROJECT_REF is required (or a *.supabase.co staging URL).",
    );
  }

  if (isProductionProjectRef(projectRef) || isProductionProjectRef(urlRef)) {
    throw new CkrStagingGuardError(
      "PRODUCTION_REF_REFUSED",
      "Project ref is production. STOP.",
    );
  }

  if (projectRef !== CKR_STAGING_PROJECT_REF) {
    throw new CkrStagingGuardError(
      "UNEXPECTED_STAGING_REF",
      `Expected pinned staging ref ${CKR_STAGING_PROJECT_REF}, got a different non-production ref.`,
    );
  }

  if (urlRef && urlRef !== projectRef) {
    throw new CkrStagingGuardError(
      "STAGING_REF_URL_MISMATCH",
      "CKR_STAGING_PROJECT_REF does not match the Supabase URL host.",
    );
  }

  if (urlRef && urlRef !== CKR_STAGING_PROJECT_REF) {
    throw new CkrStagingGuardError(
      "STAGING_URL_NOT_PINNED",
      "Supabase URL is not the pinned ckr-platform-staging project.",
    );
  }

  return {
    environment: "staging",
    projectRef,
    urlHost,
  };
}
