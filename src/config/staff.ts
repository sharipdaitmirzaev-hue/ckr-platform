/** Пути /admin, доступные оператору без полного admin. */
export const STAFF_ADMIN_PREFIXES = [
  "/admin/crm",
  "/admin/projects",
  "/admin/opportunities",
  "/admin/investments",
  "/admin/experts",
  "/admin/verifications",
  "/admin/pilot",
  "/admin/improvements",
  "/admin/beta-report",
  "/admin/beta-review",
  "/admin/launch",
  "/admin/wave-review",
  "/admin/launch-decision",
  "/admin/ecosystem-report",
  "/admin/ecosystem-value",
  "/admin/first-users",
  "/admin/first-users-review",
  "/admin/product-sprint",
  "/admin/beta-expansion",
  "/admin/open-beta-review",
  "/admin/open-beta",
  "/admin/open-beta-growth",
  "/admin/public-launch-decision",
  "/admin/public-launch",
  "/admin/public-launch-kpi",
  "/admin/public-launch-operations",
  "/admin/growth",
  "/admin/growth-kpi",
] as const;

export function isStaffAdminPath(pathname: string): boolean {
  return STAFF_ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
