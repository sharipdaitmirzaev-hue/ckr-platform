import { RoleLanding } from "@/components/marketing/role-landing";
import { roleLandings } from "@/config/public-landing";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

const content = roleLandings.experts;

export const metadata: Metadata = {
  title: "Стать экспертом",
  description: content.solution,
  openGraph: {
    title: `${content.eyebrow} · ${siteConfig.name}`,
    description: content.solution,
    url: "/expert",
    type: "website",
    locale: siteConfig.ogLocale,
  },
  alternates: { canonical: "/expert" },
};

export default function ExpertRolePage() {
  return <RoleLanding content={content} />;
}
