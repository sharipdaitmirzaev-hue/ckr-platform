import { requireAdmin } from "@/lib/auth/require-admin";
import type { CurrentUser } from "@/lib/auth/get-current-user";

/**
 * Owner-доступ к LIA Opportunity Intelligence.
 *
 * Этап 1: platform admin через requireAdmin().
 * Позже: можно добавить роль OWNER / allowlist без смены вызовов API/UI —
 * меняется только эта функция.
 */
export async function requireLiaOiOwner(): Promise<CurrentUser> {
  // Future: if (hasOwnerRole(current) || isAdmin) ...
  return requireAdmin();
}

export type { CurrentUser };
