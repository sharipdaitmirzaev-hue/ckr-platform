import { HomepageViewTracker } from "@/components/analytics/homepage-view-tracker";
import { Logo } from "@/components/brand/logo";
import { ExpertCard } from "@/components/experts/expert-card";
import { InvestmentCard } from "@/components/investments/investment-card";
import { PublicLiaEntry } from "@/components/marketing/public-lia-entry";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { ProjectCard } from "@/components/projects/project-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand } from "@/config/brand";
import {
  HOW_IT_WORKS_STEPS,
  MARKETPLACE_HERO,
  MARKETPLACE_JOURNEY,
  MARKETPLACE_ROLE_CARDS,
  TINDA_PUBLIC_CASE,
} from "@/config/marketplace";
import { siteConfig } from "@/config/site";
import { maskDisplayName } from "@/lib/demo/mode";
import { listPublishedExperts } from "@/lib/experts/queries";
import { listPublishedInvestmentOffers } from "@/lib/investments/queries";
import { listPublishedOpportunities } from "@/lib/opportunities/queries";
import { listPublishedProjects } from "@/lib/projects/queries";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: MARKETPLACE_HERO.description,
  openGraph: {
    title: MARKETPLACE_HERO.brandTitle,
    description: MARKETPLACE_HERO.description,
    url: "/",
    type: "website",
    locale: siteConfig.ogLocale,
    siteName: siteConfig.name,
  },
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [projects, opportunities, experts, investments] = await Promise.all([
    listPublishedProjects(),
    listPublishedOpportunities(),
    listPublishedExperts(),
    listPublishedInvestmentOffers(),
  ]);

  const previewProjects = projects.slice(0, 3);
  const previewOpportunities = opportunities.slice(0, 3);
  const previewExperts = experts.slice(0, 3);
  const previewInvestments = investments.slice(0, 3);

  return (
    <>
      <HomepageViewTracker />
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-radial"
        />
        <div
          aria-hidden
          className="ckr-grid-overlay pointer-events-none absolute inset-0 bg-hero-grid opacity-40"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent"
        />

        <Container className="relative flex min-h-[calc(100vh-4.25rem)] flex-col justify-center py-16 sm:py-20">
          <div className="max-w-3xl">
            <div className="animate-fade-in">
              <Logo size="lg" href="" />
              <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                {MARKETPLACE_HERO.brandTitle}
              </h1>
              <p className="mt-3 text-sm uppercase tracking-[0.18em] text-muted">
                {brand.name} · {brand.fullName}
              </p>
            </div>

            <div
              aria-hidden
              className="animate-line-draw mt-8 h-px w-28 origin-left bg-accent"
            />

            <p
              className="animate-fade-up mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
              style={{ animationDelay: "120ms" }}
            >
              {MARKETPLACE_HERO.description}
            </p>

            <div
              className="animate-fade-up mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
              style={{ animationDelay: "220ms" }}
            >
              {MARKETPLACE_HERO.ctas.map((cta, index) => (
                <ButtonLink
                  key={cta.href}
                  href={cta.href}
                  size="lg"
                  variant={index === 0 ? "primary" : "outline"}
                >
                  {cta.label}
                </ButtonLink>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Как работает ЦКР"
            title="От проблемы до результата"
            description={MARKETPLACE_JOURNEY.join(" → ")}
          />
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((item) => (
              <li key={item.step} className="border-l border-accent/40 pl-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  {item.step}
                </p>
                <h3 className="mt-3 font-display text-xl text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/lia?scenario=business_audit">
              Расскажите о вашей задаче
            </ButtonLink>
            <ButtonLink href="/about" variant="outline">
              О ЦКР
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Роли"
            title="Для кого ЦКР"
            description="Одна экосистема — четыре стороны одной задачи."
          />
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {MARKETPLACE_ROLE_CARDS.map((role) => (
              <div key={role.key} className="border-t border-border pt-6">
                <h3 className="font-display text-xl text-foreground">
                  {role.label}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {role.text}
                </p>
                <Link
                  href={role.href}
                  className="mt-5 inline-flex text-sm text-accent transition-colors hover:underline"
                >
                  Подробнее →
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Проекты"
              title="Идеи и бизнес в каталоге"
              description="Центральная сущность ЦКР — проекты, вокруг которых собираются ресурсы."
            />
            <ButtonLink href="/projects" variant="outline">
              Все проекты
            </ButtonLink>
          </div>
          {previewProjects.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {previewProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  categoryName={project.categoryName}
                  href={`/project/${project.id}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-10"
              title="Опубликованных проектов пока нет"
              description="Создайте первый проект с Лией."
              actionHref="/lia"
              actionLabel="Создать проект"
            />
          )}
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Возможности"
              title="Ресурсы и партнёрства"
              description="Земля, помещения, оборудование, услуги и предложения партнёров."
            />
            <ButtonLink href="/opportunities" variant="outline">
              Все возможности
            </ButtonLink>
          </div>
          {previewOpportunities.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {previewOpportunities.map((item) => (
                <OpportunityCard
                  key={item.id}
                  opportunity={item}
                  typeName={item.typeName}
                  href={`/opportunity/${item.id}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-10"
              title="Возможности появятся после публикации"
              actionHref="/opportunities"
              actionLabel="К каталогу"
            />
          )}
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Эксперты"
              title="Компетенции рядом с проектами"
              description="Проверенные специалисты для сопровождения реализации."
            />
            <ButtonLink href="/experts" variant="outline">
              Все эксперты
            </ButtonLink>
          </div>
          {previewExperts.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {previewExperts.map((expert) => (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  href={`/expert/${expert.id}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-10"
              title="Эксперты появятся после публикации"
              actionHref="/experts"
              actionLabel="К каталогу"
            />
          )}
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Инвестиции"
              title="Капитал для проектов"
              description="Инвестиционные предложения и форматы участия."
            />
            <ButtonLink href="/investments" variant="outline">
              Все инвестиции
            </ButtonLink>
          </div>
          {previewInvestments.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {previewInvestments.map((offer) => (
                <InvestmentCard
                  key={offer.id}
                  offer={offer}
                  ownerName={maskDisplayName(offer.ownerName, {
                    isAuthenticated: false,
                  })}
                  href={`/investment/${offer.id}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-10"
              title="Инвестиции появятся после публикации"
              actionHref="/investments"
              actionLabel="К каталогу"
            />
          )}
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <Badge variant="accent">Первый кейс</Badge>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {TINDA_PUBLIC_CASE.title}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            {TINDA_PUBLIC_CASE.summary}
          </p>
          <ol className="mt-10 flex flex-wrap items-center gap-3 text-sm text-foreground">
            {TINDA_PUBLIC_CASE.path.map((step, index) => (
              <li key={step} className="flex items-center gap-3">
                {index > 0 ? <span className="text-muted">↓</span> : null}
                <span className="border-l border-accent/40 pl-3 font-display text-lg">
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <ButtonLink href={TINDA_PUBLIC_CASE.href} variant="outline">
              Смотреть кейсы
            </ButtonLink>
          </div>
        </Container>
      </section>

      <PublicLiaEntry />
    </>
  );
}
