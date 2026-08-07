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
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
            {content.audience}
          </p>
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
            <SectionHeading
              eyebrow="Кому подходит"
              title="Для кого эта страница"
            />
            <p className="mt-6 text-base leading-relaxed text-muted">
              {content.audience}
            </p>
          </div>
          <div>
            <SectionHeading eyebrow="Проблема" title="Что мешает сейчас" />
            <p className="mt-6 text-base leading-relaxed text-muted">
              {content.problem}
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-border py-16 sm:py-20">
        <Container className="max-w-3xl">
          <SectionHeading
            eyebrow="Как работает ЦКР"
            title="Как помогает платформа"
          />
          <p className="mt-6 text-base leading-relaxed text-muted">
            {content.solution}
          </p>
        </Container>
      </section>

      {content.scenario && content.scenario.length > 0 ? (
        <section className="border-b border-border py-16 sm:py-20">
          <Container>
            <SectionHeading
              eyebrow="Путь"
              title="Как работать в ЦКР"
              description="Типовой путь роли — от входа до результата."
            />
            <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      {content.blocks && content.blocks.length > 0 ? (
        <section className="border-b border-border py-16 sm:py-20">
          <Container>
            <SectionHeading
              eyebrow="Возможности"
              title="Что доступно в ЦКР"
            />
            <ul className="mt-10 grid gap-8 sm:grid-cols-2">
              {content.blocks.map((block) => (
                <li key={block.title} className="border-l border-accent/40 pl-5">
                  <h3 className="font-display text-xl text-foreground">
                    {block.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {block.text}
                  </p>
                  <ButtonLink
                    href={block.href}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Открыть
                  </ButtonLink>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      <section className="border-b border-border py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Что сделать дальше"
            title={content.nextStep.label}
            description="Регистрация → роль → профиль → первое действие. Без тупиков."
          />
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {content.advantages.map((item, index) => (
              <li key={item} className="border-l border-accent/40 pl-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  0{index + 1}
                </p>
                <p className="mt-2 font-display text-lg text-foreground">
                  {item}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href={content.nextStep.href} size="lg">
              {content.nextStep.label}
            </ButtonLink>
            <ButtonLink href={content.ctaPrimary.href} variant="outline" size="lg">
              {content.ctaPrimary.label}
            </ButtonLink>
            <ButtonLink href="/contacts" variant="outline" size="lg">
              Контакты
            </ButtonLink>
          </div>
        </Container>
      </section>

      {children}
    </div>
  );
}
