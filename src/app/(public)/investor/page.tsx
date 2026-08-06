import { RoleLanding } from "@/components/marketing/role-landing";
import { roleLandings } from "@/config/public-landing";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

const content = roleLandings.investors;

export const metadata: Metadata = {
  title: "Для инвесторов",
  description: content.solution,
  openGraph: {
    title: `${content.eyebrow} · ${siteConfig.name}`,
    description: content.solution,
    url: "/investor",
    type: "website",
    locale: siteConfig.ogLocale,
  },
  alternates: { canonical: "/investor" },
};

export default function InvestorPage() {
  return <RoleLanding content={content} />;
}
