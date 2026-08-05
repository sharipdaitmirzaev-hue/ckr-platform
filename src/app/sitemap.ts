import { roleLandings } from "@/config/public-landing";
import { siteConfig } from "@/config/site";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes = [
    "",
    "/about",
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
            path === "/experts"
          ? 0.9
          : 0.7,
  }));
}
