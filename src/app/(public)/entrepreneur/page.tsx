import { RoleLanding } from "@/components/marketing/role-landing";
import { roleLandings } from "@/config/public-landing";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

const content = roleLandings.entrepreneurs;

export const metadata: Metadata = {
  title: "Для предпринимателей",
  description: content.solution,
  openGraph: {
    title: `${content.eyebrow} · ${siteConfig.name}`,
    description: content.solution,
    url: "/entrepreneur",
    type: "website",
    locale: siteConfig.ogLocale,
  },
  alternates: { canonical: "/entrepreneur" },
};

export default function EntrepreneurPage() {
  return <RoleLanding content={content} />;
}
