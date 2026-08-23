#!/usr/bin/env npx tsx
/**
 * Print a safe staging-target verdict. Never logs secret values.
 */
import {
  assertCkrStagingTarget,
  CkrStagingGuardError,
} from "./lib/ckr-staging-guard";

try {
  const target = assertCkrStagingTarget();
  console.log("STAGING_TARGET_OK", JSON.stringify(target));
} catch (e) {
  if (e instanceof CkrStagingGuardError) {
    console.error("STAGING_TARGET_REFUSED", e.code, e.message);
    process.exit(2);
  }
  console.error(e);
  process.exit(1);
}
