import { getCurrentUser, type CurrentUser } from "@/lib/auth/get-current-user";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { OperatorRole } from "@/config/operator";
import { redirect } from "next/navigation";

export type OperatorSession = CurrentUser & {
  operatorRoles: OperatorRole[];
  isPlatformAdmin: boolean;
};

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

/** Доступ в /operator: platform admin или активная operator_roles. */
export async function requireOperator(): Promise<OperatorSession> {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/login?next=/operator");
  }

  const isPlatformAdmin = current.roles.includes("admin");
  const operatorRoles = await loadOperatorRoles(current.user.id);

  if (!isPlatformAdmin && operatorRoles.length === 0) {
    redirect("/dashboard");
  }

  return {
    ...current,
    operatorRoles,
    isPlatformAdmin,
  };
}
