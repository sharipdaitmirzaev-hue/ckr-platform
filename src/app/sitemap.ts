import { roleLandings } from "@/config/public-landing";
import { siteConfig } from "@/config/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes = [
    "",
    "/about",
    "/services",
    "/lia",
    "/how-it-works",
    "/cases",
    "/trust",
    "/contacts",
    "/privacy",
    "/terms",
    "/personal-data",
    "/features",
    "/projects",
    "/opportunities",
    "/investments",
    "/experts",
    "/solutions",
    "/pricing",
    "/demo",
    "/entrepreneur",
    "/investor",
    "/expert",
    "/organization",
    "/entrepreneurs",
    "/investors",
    "/login",
    "/register",
  ];

  const highPriority = new Set([
    "",
    "/about",
    "/services",
    "/lia",
    "/projects",
    "/experts",
    "/investments",
    "/opportunities",
    "/cases",
    "/trust",
    "/contacts",
    roleLandings.entrepreneurs.href,
    roleLandings.investors.href,
    roleLandings.experts.href,
    roleLandings.organizations.href,
  ]);

  return staticRoutes.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : highPriority.has(path) ? 0.9 : 0.7,
  }));
}
