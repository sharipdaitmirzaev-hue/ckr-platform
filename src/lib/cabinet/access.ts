import {
  dashboardNavMore,
  dashboardNavPrimary,
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

  const [
    { data: profile },
    { count: orgCount },
    { count: needCount },
    { count: projectCount },
  ] = await Promise.all([
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

/**
 * UX B — primary client nav.
 * Company only if org exists. Opportunities from STANDARD+.
 * BASIC: Главная · Обращения · Профиль (+ Компания if org)
 */
export function resolveDashboardNav(ctx: CabinetContext): NavItem[] {
  const items: NavItem[] = [
    { label: "Главная", href: "/dashboard" },
    { label: "Обращения", href: "/dashboard/ckr-requests" },
  ];

  if (ctx.accessLevel !== "basic" || ctx.hasNeeds) {
    items.push({ label: "Возможности", href: "/dashboard/for-you" });
  }

  if (ctx.hasOrganization) {
    items.push({ label: "Компания", href: "/partner" });
  }

  items.push({ label: "Профиль", href: "/dashboard/settings" });
  return items;
}

/** Power tools under «Ещё» — ADVANCED (and admin). Deep links kept. */
export function resolveDashboardMoreNav(ctx: CabinetContext): NavItem[] {
  if (ctx.accessLevel === "advanced" || ctx.isAdmin) {
    return [...dashboardNavMore];
  }
  if (ctx.accessLevel === "standard") {
    return dashboardNavMore.filter((i) =>
      ["/dashboard/needs", "/dashboard/notifications"].includes(i.href),
    );
  }
  return [];
}

export { dashboardNavPrimary };
