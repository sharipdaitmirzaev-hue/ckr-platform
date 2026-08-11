import { LiaWidget } from "@/components/lia/lia-widget";
import { FeedbackButton } from "@/features/beta/components/feedback-button";
import { ScenarioFeedbackPrompt } from "@/features/beta/components/scenario-feedback-prompt";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import { Manrope, Onest } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  authors: [{ name: "Дайитмирзаев Шарип Абдурахманович" }],
  creator: "ИП Дайитмирзаев Шарип Абдурахманович",
  publisher: "ИП Дайитмирзаев Шарип Абдурахманович",
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    locale: siteConfig.ogLocale,
    type: "website",
    siteName: siteConfig.name,
    url: siteConfig.url,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} ${onest.variable}`}>
        {children}
        <LiaWidget />
        <FeedbackButton />
        <Suspense fallback={null}>
          <ScenarioFeedbackPrompt />
        </Suspense>
      </body>
    </html>
  );
}
