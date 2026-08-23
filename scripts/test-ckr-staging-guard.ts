/**
 * Unit tests for staging isolation guard (no network, no secrets).
 * Run: npm run test:ckr-staging-guard
 */
import assert from "node:assert/strict";
import {
  CKR_PRODUCTION_PROJECT_REF,
  CKR_STAGING_PROJECT_REF,
  CkrStagingGuardError,
  assertCkrStagingTarget,
  extractProjectRefFromSupabaseUrl,
  isProductionHostname,
  isProductionProjectRef,
} from "./lib/ckr-staging-guard";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(e instanceof Error ? e.stack : e);
  }
}

const stagingUrl = `https://${CKR_STAGING_PROJECT_REF}.supabase.co`;
const prodUrl = `https://${CKR_PRODUCTION_PROJECT_REF}.supabase.co`;

function validEnv(extra: Record<string, string> = {}) {
  return {
    CKR_ENVIRONMENT: "staging",
    CKR_ALLOW_STAGING_E2E: "YES",
    CKR_STAGING_PROJECT_REF: CKR_STAGING_PROJECT_REF,
    CKR_STAGING_SUPABASE_URL: stagingUrl,
    ...extra,
  };
}

async function main() {
await test("extracts ref from supabase URL", () => {
  assert.equal(
    extractProjectRefFromSupabaseUrl(stagingUrl),
    CKR_STAGING_PROJECT_REF,
  );
});

await test("detects production hostname and ref", () => {
  assert.equal(isProductionHostname("ckr-center.ru"), true);
  assert.equal(isProductionHostname(`${CKR_PRODUCTION_PROJECT_REF}.supabase.co`), true);
  assert.equal(isProductionProjectRef(CKR_PRODUCTION_PROJECT_REF), true);
  assert.equal(isProductionProjectRef(CKR_STAGING_PROJECT_REF), false);
});

await test("accepts pinned staging target", () => {
  const t = assertCkrStagingTarget(validEnv());
  assert.equal(t.environment, "staging");
  assert.equal(t.projectRef, CKR_STAGING_PROJECT_REF);
});

await test("refuses missing CKR_ENVIRONMENT", () => {
  assert.throws(
    () => assertCkrStagingTarget(validEnv({ CKR_ENVIRONMENT: "production" })),
    (e: unknown) => e instanceof CkrStagingGuardError && e.code === "CKR_ENVIRONMENT_NOT_STAGING",
  );
});

await test("refuses production URL", () => {
  assert.throws(
    () =>
      assertCkrStagingTarget(
        validEnv({
          CKR_STAGING_SUPABASE_URL: prodUrl,
          NEXT_PUBLIC_SUPABASE_URL: prodUrl,
        }),
      ),
    (e: unknown) => e instanceof CkrStagingGuardError && e.code === "PRODUCTION_URL_REFUSED",
  );
});

await test("refuses production project ref", () => {
  assert.throws(
    () =>
      assertCkrStagingTarget(
        validEnv({ CKR_STAGING_PROJECT_REF: CKR_PRODUCTION_PROJECT_REF }),
      ),
    (e: unknown) =>
      e instanceof CkrStagingGuardError &&
      (e.code === "PRODUCTION_REF_REFUSED" || e.code === "STAGING_REF_URL_MISMATCH"),
  );
});

await test("refuses ckr-center.ru", () => {
  assert.throws(
    () =>
      assertCkrStagingTarget(
        validEnv({ CKR_STAGING_SUPABASE_URL: "https://ckr-center.ru" }),
      ),
    (e: unknown) => e instanceof CkrStagingGuardError && e.code === "PRODUCTION_URL_REFUSED",
  );
});

await test("refuses CKR_E2E_ALLOW_PRODUCTION", () => {
  assert.throws(
    () => assertCkrStagingTarget(validEnv({ CKR_E2E_ALLOW_PRODUCTION: "1" })),
    (e: unknown) => e instanceof CkrStagingGuardError && e.code === "PRODUCTION_E2E_FORBIDDEN",
  );
});

await test("refuses unexpected non-production ref", () => {
  assert.throws(
    () =>
      assertCkrStagingTarget(
        validEnv({
          CKR_STAGING_PROJECT_REF: "aaaaaaaaaaaaaaaaaaaa",
          CKR_STAGING_SUPABASE_URL: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co",
        }),
      ),
    (e: unknown) => e instanceof CkrStagingGuardError && e.code === "UNEXPECTED_STAGING_REF",
  );
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
