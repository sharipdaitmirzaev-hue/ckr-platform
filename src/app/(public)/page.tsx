import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { LANDING } from "@/config/landing";
import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: LANDING.seoDescription,
  openGraph: {
    title: `${siteConfig.name} — ${LANDING.fullName}`,
    description: LANDING.seoDescription,
    url: "/",
    type: "website",
    locale: siteConfig.ogLocale,
    siteName: siteConfig.name,
  },
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const current = await getCurrentUser();
  const secondary = current
    ? LANDING.secondaryAuthedCta
    : LANDING.secondaryCta;

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-hero-radial"
      />
      <div
        aria-hidden
        className="ckr-grid-overlay pointer-events-none absolute inset-0 bg-hero-grid opacity-30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/70 to-transparent"
      />

      <Container className="relative flex min-h-screen flex-col items-center justify-center px-5 py-16 text-center sm:py-20">
        <div className="animate-fade-in flex max-w-2xl flex-col items-center">
          <Logo size="xl" href="" className="justify-center" />

          <p className="mt-6 text-xs font-medium uppercase tracking-[0.22em] text-muted sm:text-sm">
            {LANDING.fullName}
          </p>

          <p className="mt-5 font-display text-base font-semibold tracking-[0.14em] text-foreground sm:text-lg">
            {LANDING.motto}
          </p>

          <div
            aria-hidden
            className="animate-line-draw mt-8 h-px w-20 origin-center bg-accent"
          />

          <div
            className="animate-fade-up mt-8 max-w-xl space-y-3 text-sm leading-relaxed text-muted sm:text-base"
            style={{ animationDelay: "120ms" }}
          >
            {LANDING.mission.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div
            className="animate-fade-up mt-12 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center"
            style={{ animationDelay: "220ms" }}
          >
            <ButtonLink
              href={LANDING.primaryCta.href}
              size="lg"
              variant="primary"
              className="w-full sm:w-auto"
            >
              {LANDING.primaryCta.label}
            </ButtonLink>
            <ButtonLink
              href={secondary.href}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              {secondary.label}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
