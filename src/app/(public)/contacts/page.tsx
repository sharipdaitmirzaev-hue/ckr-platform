import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { legalConfig } from "@/config/legal";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Контакты поддержки платформы ЦКР и ссылка на правовую информацию.",
  openGraph: {
    title: `Контакты · ${siteConfig.name}`,
    description: "Связь с поддержкой ЦКР и правовая информация.",
    url: "/contacts",
    type: "website",
    locale: siteConfig.ogLocale,
    siteName: siteConfig.name,
  },
  alternates: { canonical: "/contacts" },
};

export default function ContactsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border py-16 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-radial opacity-80"
        />
        <Container className="relative max-w-3xl">
          <Badge variant="accent">Связь</Badge>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Контакты
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
            По вопросам работы платформы {legalConfig.projectShortName} пишите
            на официальный адрес поддержки.
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="max-w-3xl space-y-12">
          <article className="space-y-3">
            <h2 className="font-display text-xl text-foreground">Поддержка</h2>
            <p className="text-base text-muted">
              Email:{" "}
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="text-accent hover:underline"
              >
                {siteConfig.supportEmail}
              </a>
            </p>
          </article>

          <article className="space-y-3 border-t border-border pt-10">
            <h2 className="font-display text-xl text-foreground">
              Правовая информация
            </h2>
            <p className="text-base leading-relaxed text-muted">
              {legalConfig.copy.activityLine}
            </p>
            <p className="text-base leading-relaxed text-muted">
              {legalConfig.founderStatement}
            </p>
            <p className="pt-2">
              <Link
                href="/requisites"
                className="text-sm text-accent transition-colors hover:underline"
              >
                Реквизиты →
              </Link>
            </p>
          </article>
        </Container>
      </section>
    </>
  );
}
