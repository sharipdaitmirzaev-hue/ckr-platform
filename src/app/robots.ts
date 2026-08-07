import { siteConfig } from "@/config/site";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/admin",
          "/admin/",
          "/messages",
          "/onboarding",
          "/api/",
          "/api/demo/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
