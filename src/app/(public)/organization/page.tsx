import { RoleLanding } from "@/components/marketing/role-landing";
import { roleLandings } from "@/config/public-landing";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

const content = roleLandings.organizations;

export const metadata: Metadata = {
  title: "Для организаций",
  description: content.solution,
  openGraph: {
    title: `${content.eyebrow} · ${siteConfig.name}`,
    description: content.solution,
    url: "/organization",
    type: "website",
    locale: siteConfig.ogLocale,
  },
  alternates: { canonical: "/organization" },
};

export default function OrganizationPage() {
  return <RoleLanding content={content} />;
}
