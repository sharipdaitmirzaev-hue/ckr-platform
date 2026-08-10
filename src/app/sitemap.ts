import { roleLandings } from "@/config/public-landing";
import { siteConfig } from "@/config/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes = [
    "",
    "/about",
    "/how-it-works",
    "/cases",
    "/trust",
    "/privacy",
    "/terms",
    "/features",
    "/projects",
    "/opportunities",
    "/investments",
    "/experts",
    "/solutions",
    "/pricing",
    "/services",
    "/demo",
    "/lia",
    "/entrepreneur",
    "/investor",
    "/expert",
    "/organization",
    "/entrepreneurs",
    "/investors",
    "/login",
    "/register",
  ];

  return staticRoutes.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority:
      path === ""
        ? 1
        : path === roleLandings.entrepreneurs.href ||
            path === roleLandings.investors.href ||
            path === roleLandings.organizations.href ||
            path === "/experts" ||
            path === "/how-it-works" ||
            path === "/cases" ||
            path === "/trust"
          ? 0.9
          : 0.7,
  }));
}
