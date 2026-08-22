import { Container } from "@/components/ui/container";
import { legalConfig } from "@/config/legal";
import Link from "next/link";

/** Компактный блок идентичности проекта для низа главной. */
export function ProjectIdentityBlock() {
  return (
    <section className="border-t border-border py-14 sm:py-16">
      <Container className="max-w-2xl">
        <h2 className="font-display text-xl text-foreground sm:text-2xl">
          {legalConfig.projectShortName} — {legalConfig.projectFullName}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted">
          {legalConfig.copy.homeSupport}
        </p>
        <p className="mt-4 text-base leading-relaxed text-foreground">
          {legalConfig.founderStatement}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {legalConfig.copy.activityLine}
        </p>
        <p className="mt-6">
          <Link
            href="/about"
            className="text-sm text-accent transition-colors hover:underline"
          >
            О ЦКР →
          </Link>
        </p>
      </Container>
    </section>
  );
}
