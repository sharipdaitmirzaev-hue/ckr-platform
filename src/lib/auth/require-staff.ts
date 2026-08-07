import { getCurrentUser, type CurrentUser } from "@/lib/auth/get-current-user";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { OperatorRole } from "@/config/operator";
import { redirect } from "next/navigation";

export type StaffSession = CurrentUser & {
  operatorRoles: OperatorRole[];
  isPlatformAdmin: boolean;
  isOperator: boolean;
};

export {
  STAFF_ADMIN_PREFIXES,
  isStaffAdminPath,
} from "@/config/staff";

async function loadOperatorRoles(userId: string): Promise<OperatorRole[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("operator_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("active", true);
    if (error || !data) return [];
    return data.map((row) => row.role as OperatorRole);
  } catch {
    return [];
  }
}

/**
 * Admin платформы или активный operator (без redirect).
 * Для условного UI (например, коммерческий блок в workspace).
 */
export async function getStaffSession(): Promise<StaffSession | null> {
  const current = await getCurrentUser();
  if (!current) return null;

  const isPlatformAdmin = current.roles.includes("admin");
  const operatorRoles = await loadOperatorRoles(current.user.id);
  const isOperator = operatorRoles.length > 0;
  if (!isPlatformAdmin && !isOperator) return null;

  return {
    ...current,
    operatorRoles,
    isPlatformAdmin,
    isOperator,
  };
}

/**
 * Admin платформы или активный operator.
 * Для CRM, модерации и операционных действий closed pilot.
 */
export async function requireStaff(
  nextPath = "/admin/crm",
): Promise<StaffSession> {
  const session = await getStaffSession();

  if (!session) {
    const current = await getCurrentUser();
    if (!current) {
      redirect(`/login?next=${encodeURIComponent(nextPath)}`);
    }
    redirect("/dashboard");
  }

  return session;
}
