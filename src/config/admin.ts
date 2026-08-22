import {
  operatorPrimaryNav,
  operatorSystemNav,
} from "@/config/navigation";

export type AdminNavItem = {
  label: string;
  href: string;
  description?: string;
};

/** Stage / launch archive — System bucket only. Routes kept. */
export const adminStageArchiveNav: AdminNavItem[] = [
  { label: "Closed Pilot", href: "/admin/pilot" },
  { label: "Beta Report", href: "/admin/beta-report" },
  { label: "Beta Review", href: "/admin/beta-review" },
  { label: "Launch", href: "/admin/launch" },
  { label: "Wave Review", href: "/admin/wave-review" },
  { label: "Launch Decision", href: "/admin/launch-decision" },
  { label: "Ecosystem Report", href: "/admin/ecosystem-report" },
  { label: "Ecosystem Value", href: "/admin/ecosystem-value" },
  { label: "First Users", href: "/admin/first-users" },
  { label: "First Users Review", href: "/admin/first-users-review" },
  { label: "Product Fix Sprint", href: "/admin/product-sprint" },
  { label: "Beta Expansion", href: "/admin/beta-expansion" },
  { label: "Open Beta Review", href: "/admin/open-beta-review" },
  { label: "Open Beta", href: "/admin/open-beta" },
  { label: "Open Beta Growth", href: "/admin/open-beta-growth" },
  { label: "Public Launch Decision", href: "/admin/public-launch-decision" },
  { label: "Public Launch", href: "/admin/public-launch" },
  { label: "Public Launch KPI", href: "/admin/public-launch-kpi" },
  { label: "Launch Operations", href: "/admin/public-launch-operations" },
  { label: "Growth KPI", href: "/admin/growth-kpi" },
  { label: "Project Acquisition", href: "/admin/project-acquisition" },
];

/**
 * Full archive of admin deep links (routes preserved).
 * UX B chrome: operatorPrimaryNav + operatorSystemNav (+ stage archive under Система).
 */
export const adminNavItems: AdminNavItem[] = [
  ...operatorPrimaryNav,
  ...operatorSystemNav,
  ...adminStageArchiveNav,
  {
    label: "Партнёры",
    href: "/partner",
    description: "Кабинет организаций партнёрской сети",
  },
];

export { operatorPrimaryNav, operatorSystemNav };
