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
] as const;

export function isStaffAdminPath(pathname: string): boolean {
  return STAFF_ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
