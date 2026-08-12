import {
  dashboardNavAdvanced,
  dashboardNavBasic,
  dashboardNavStandard,
  type NavItem,
} from "@/config/navigation";
import type { CkrAccessLevel } from "@/config/idea-first";
import { isCkrAccessLevel } from "@/config/idea-first";
import { createClient } from "@/lib/supabase/server";

export type CabinetContext = {
  accessLevel: CkrAccessLevel;
  hasOrganization: boolean;
  hasNeeds: boolean;
  hasProjects: boolean;
  isAdmin: boolean;
};

/**
 * Resolve progressive cabinet access without a second RBAC system.
 * Priority: admin → profile.ckr_access_level → derived from entities → basic.
 */
export async function resolveCabinetContext(
  userId: string,
  roles: string[],
): Promise<CabinetContext> {
  const supabase = createClient();
  const isAdmin = roles.includes("admin");

  const [{ data: profile }, { count: orgCount }, { count: needCount }, { count: projectCount }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("ckr_access_level")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("need_profiles")
        .select("id", { count: "exact", head: true })
        .eq("owner_type", "user")
        .eq("owner_id", userId),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId),
    ]);

  const hasOrganization = (orgCount ?? 0) > 0;
  const hasNeeds = (needCount ?? 0) > 0;
  const hasProjects = (projectCount ?? 0) > 0;

  let accessLevel: CkrAccessLevel = "basic";
  const stored = (profile as { ckr_access_level?: string } | null)
    ?.ckr_access_level;
  if (isAdmin) {
    accessLevel = "advanced";
  } else if (stored && isCkrAccessLevel(stored) && stored !== "basic") {
    accessLevel = stored;
  } else if (hasProjects || hasNeeds) {
    accessLevel = "standard";
  } else if (hasOrganization) {
    accessLevel = "standard";
  }

  return {
    accessLevel,
    hasOrganization,
    hasNeeds,
    hasProjects,
    isAdmin,
  };
}

export function resolveDashboardNav(ctx: CabinetContext): NavItem[] {
  if (ctx.accessLevel === "advanced" || ctx.isAdmin) {
    return dashboardNavAdvanced;
  }
  if (ctx.accessLevel === "standard") {
    const items = [...dashboardNavStandard];
    if (!ctx.hasOrganization) {
      return items.filter((i) => i.href !== "/partner");
    }
    return items;
  }
  // basic
  const items = [...dashboardNavBasic];
  if (ctx.hasOrganization) {
    items.splice(2, 0, { label: "Моя компания", href: "/partner" });
  }
  return items;
}
