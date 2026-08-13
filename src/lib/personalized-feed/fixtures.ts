/**
 * Stage 4L — detect smoke/seed/stub fixtures so they never enter
 * a real request workbench / SEEK_BUYER working set.
 *
 * Be conservative: do NOT treat publish provenance notes like
 * «Stage 4E controlled publish» as smoke — those are real published rows.
 */

const SMOKE_TITLE_RE =
  /\b(smoke-public|smoke[_-][a-z0-9]|\[smoke\]|safe_to_delete|safe-to-delete|\[safe_to_delete\]|fixture\b|test\s*data)\b/i;

const STUB_RE = /\[STUB\]|stub-сигнала|stub_signal|stub-signal/i;

const SEED_RE =
  /\b(seed[_-]demo|seed-public|\[seed\]|demo[_-]fixture|beta-кейс|beta кейс)\b/i;

const FIXTURE_ID_RE =
  /^(aaaaaaaa|bbbbbbbb|a0000001|a1000001|a3000001|a4000001|a1111111|a2222222)-/i;

export type FixtureClass = "REAL" | "SMOKE" | "SEED" | "STUB" | "UNKNOWN";

export function classifyFixtureSignal(input: {
  id?: string | null;
  title?: string | null;
  summary?: string | null;
  source?: string | null;
  sourceLabel?: string | null;
  sourceType?: string | null;
  fingerprint?: string | null;
  email?: string | null;
  idempotencyKey?: string | null;
}): FixtureClass {
  const title = input.title || "";
  const summary = input.summary || "";
  const idBlob = [
    input.id,
    input.email,
    input.idempotencyKey,
    input.fingerprint,
    input.source,
    input.sourceLabel,
    input.sourceType,
  ]
    .filter(Boolean)
    .join(" ");

  // STUB: explicit stub markers in title/summary (LIA preliminary analysis)
  if (STUB_RE.test(title) || STUB_RE.test(summary) || STUB_RE.test(idBlob)) {
    return "STUB";
  }

  // SMOKE: title-first + emails / smoke- ids — not stage publish provenance
  if (
    SMOKE_TITLE_RE.test(title) ||
    SMOKE_TITLE_RE.test(summary) ||
    /@ckr\.local\b/i.test(idBlob) ||
    /smoke-/i.test(idBlob) ||
    /SAFE_TO_DELETE/i.test(title + summary + idBlob)
  ) {
    return "SMOKE";
  }

  if (FIXTURE_ID_RE.test(input.id || "") || SEED_RE.test(title + " " + summary + " " + idBlob)) {
    return "SEED";
  }

  return "UNKNOWN";
}

/** True when the candidate must be excluded from real workbench / client share. */
export function isFixtureNoise(input: {
  id?: string | null;
  title?: string | null;
  summary?: string | null;
  source?: string | null;
  sourceLabel?: string | null;
  sourceType?: string | null;
  fingerprint?: string | null;
  email?: string | null;
  idempotencyKey?: string | null;
}): boolean {
  const cls = classifyFixtureSignal(input);
  return cls === "SMOKE" || cls === "SEED" || cls === "STUB";
}
