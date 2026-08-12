import { PublicIdeaForm } from "@/features/idea-first/components/public-idea-form";
import { Container } from "@/components/ui/container";
import { IDEA_FORM } from "@/config/idea-first";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${IDEA_FORM.title} · ${siteConfig.name}`,
  description: IDEA_FORM.subtitle,
};

export default function IdeaPage() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-hero-radial opacity-70"
      />
      <Container className="relative max-w-2xl">
        <p className="text-sm uppercase tracking-[0.18em] text-muted">ЦКР</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {IDEA_FORM.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          {IDEA_FORM.subtitle}
        </p>
        <div className="mt-10 rounded-sm border border-border bg-surface/80 p-5 sm:p-8">
          <PublicIdeaForm />
        </div>
      </Container>
    </section>
  );
}
