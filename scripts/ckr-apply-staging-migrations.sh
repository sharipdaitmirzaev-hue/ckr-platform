#!/usr/bin/env bash
# Apply supabase migrations to the pinned staging project only.
# Never targets production. Requires CKR_ENVIRONMENT=staging and staging flags.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-staging-guard.sh"

ckr_assert_staging_target

if [[ "${CKR_STAGING_PROJECT_REF}" == "${CKR_PRODUCTION_PROJECT_REF}" ]]; then
  ckr_staging_die "refused production project ref"
fi

if [[ -z "${CKR_STAGING_DB_PASSWORD:-}" ]]; then
  ckr_staging_die "CKR_STAGING_DB_PASSWORD missing — cannot db push"
fi

cd "${SCRIPT_DIR}/.."

echo "[STAGING] db push --dry-run ref=${CKR_STAGING_PROJECT_REF}"
npx --yes supabase db push \
  --project-ref "${CKR_STAGING_PROJECT_REF}" \
  --password "${CKR_STAGING_DB_PASSWORD}" \
  --yes \
  --dry-run

if [[ "${1:-}" == "--dry-run-only" ]]; then
  echo "[STAGING] dry-run only — no apply"
  exit 0
fi

echo "[STAGING] db push apply ref=${CKR_STAGING_PROJECT_REF}"
npx --yes supabase db push \
  --project-ref "${CKR_STAGING_PROJECT_REF}" \
  --password "${CKR_STAGING_DB_PASSWORD}" \
  --yes
