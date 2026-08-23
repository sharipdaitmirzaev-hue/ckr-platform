#!/usr/bin/env bash
# Staging isolation guard. Source from other scripts. Never prints secret values.
# shellcheck disable=SC2034

CKR_PRODUCTION_PROJECT_REF="${CKR_PRODUCTION_PROJECT_REF:-qsnbkhzewqlutdznrppl}"
CKR_STAGING_PROJECT_REF_PINNED="${CKR_STAGING_PROJECT_REF_PINNED:-ymxonxfmvnqexgalwhmn}"

ckr_staging_die() {
  printf '[STAGING_GUARD] %s\n' "$*" >&2
  exit 2
}

ckr_staging_host_of() {
  local raw="${1:-}"
  raw="${raw#http://}"
  raw="${raw#https://}"
  printf '%s\n' "${raw%%/*}"
}

ckr_assert_staging_target() {
  if [[ "${CKR_ENVIRONMENT:-}" != "staging" ]]; then
    ckr_staging_die "CKR_ENVIRONMENT must be staging"
  fi
  if [[ "${CKR_ALLOW_STAGING_E2E:-}" != "YES" ]]; then
    ckr_staging_die "CKR_ALLOW_STAGING_E2E must be YES"
  fi
  if [[ "${CKR_E2E_ALLOW_PRODUCTION:-}" == "1" ]]; then
    ckr_staging_die "CKR_E2E_ALLOW_PRODUCTION is forbidden"
  fi

  local url="${CKR_STAGING_SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
  if [[ -z "${url}" ]]; then
    ckr_staging_die "CKR_STAGING_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL missing"
  fi

  local host
  host="$(ckr_staging_host_of "${url}")"
  if [[ "${host}" == *ckr-center.ru* ]] || [[ "${host}" == *"${CKR_PRODUCTION_PROJECT_REF}"* ]]; then
    ckr_staging_die "URL points at production — STOP"
  fi

  local ref="${CKR_STAGING_PROJECT_REF:-}"
  if [[ -z "${ref}" ]]; then
    ckr_staging_die "CKR_STAGING_PROJECT_REF missing"
  fi
  if [[ "${ref}" == "${CKR_PRODUCTION_PROJECT_REF}" ]]; then
    ckr_staging_die "CKR_STAGING_PROJECT_REF is production — STOP"
  fi
  if [[ "${ref}" != "${CKR_STAGING_PROJECT_REF_PINNED}" ]]; then
    ckr_staging_die "CKR_STAGING_PROJECT_REF is not the pinned ckr-platform-staging project"
  fi
  if [[ "${host}" != *"${ref}"* ]]; then
    ckr_staging_die "URL host does not contain staging project ref — STOP"
  fi

  printf '[STAGING_GUARD] OK ref=%s host=%s\n' "${ref}" "${host}"
}
