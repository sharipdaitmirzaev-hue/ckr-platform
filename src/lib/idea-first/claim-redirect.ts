/**
 * Stage 4P — Idea → Cabinet continuity.
 * Pending claim cookie (72h) wins over LIA / role-default first step.
 */

export const CLAIM_DASHBOARD_PATH = "/dashboard?claim=1";

/**
 * After register/onboarding, choose where the user goes next.
 * Pending idea claim always has priority over role-based LIA path.
 */
export function resolvePostAuthRedirect(input: {
  hasPendingClaim: boolean;
  nextPath?: string | null;
  roleDefaultPath: string;
}): string {
  if (input.hasPendingClaim) return CLAIM_DASHBOARD_PATH;

  const next = input.nextPath?.trim() || "";
  if (isClaimNextPath(next)) {
    return CLAIM_DASHBOARD_PATH;
  }

  return input.roleDefaultPath;
}

export function isClaimNextPath(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  if (v === CLAIM_DASHBOARD_PATH) return true;
  if (!v.startsWith("/dashboard")) return false;
  return /(?:^|[?&])claim=1(?:&|$)/.test(v);
}
