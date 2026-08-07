import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import type { RoleLandingContent } from "@/config/public-landing";
import type { ReactNode } from "react";

type RoleLandingProps = {
  content: RoleLandingContent;
  children?: ReactNode;
};

export function RoleLanding({ content, children }: RoleLandingProps) {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border py-16 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-radial opacity-80"
        />
        <Container className="relative max-w-3xl">
          <Badge variant="accent">{content.eyebrow}</Badge>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            {content.title}
          </h1>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={content.ctaPrimary.href} size="lg">
              {content.ctaPrimary.label}
            </ButtonLink>
            <ButtonLink
              href={content.ctaSecondary.href}
              variant="outline"
              size="lg"
            >
              {content.ctaSecondary.label}
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="border-b border-border py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Проблема" title="Что мешает сейчас" />
            <p className="mt-6 text-base leading-relaxed text-muted">
              {content.problem}
            </p>
          </div>
          <div>
            <SectionHeading eyebrow="Решение ЦКР" title="Как помогает платформа" />
            <p className="mt-6 text-base leading-relaxed text-muted">
              {content.solution}
            </p>
          </div>
        </Container>
      </section>

      {content.scenario && content.scenario.length > 0 ? (
        <section className="border-b border-border py-16 sm:py-20">
          <Container>
            <SectionHeading
              eyebrow="Сценарий"
              title="Как работать в ЦКР"
              description="Типовой путь роли — от входа до результата."
            />
            <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {content.scenario.map((step, index) => (
                <li key={step} className="border-l border-accent/40 pl-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    0{index + 1}
                  </p>
                  <p className="mt-2 font-display text-lg text-foreground">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      ) : null}

      <section className="border-b border-border py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Преимущества"
            title="Почему участники выбирают ЦКР"
          />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {content.advantages.map((item, index) => (
              <li
                key={item}
                className="border-l border-accent/40 pl-4"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  0{index + 1}
                </p>
                <p className="mt-2 font-display text-lg text-foreground">
                  {item}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink href={content.ctaPrimary.href}>
              {content.ctaPrimary.label}
            </ButtonLink>
            <ButtonLink href={content.ctaSecondary.href} variant="outline">
              {content.ctaSecondary.label}
            </ButtonLink>
            <ButtonLink href="/register" variant="outline">
              Регистрация
            </ButtonLink>
          </div>
        </Container>
      </section>

      {children}
    </div>
  );
}
