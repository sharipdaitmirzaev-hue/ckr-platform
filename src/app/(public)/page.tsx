import { Logo } from "@/components/brand/logo";
import { OpportunityCard } from "@/components/opportunities/opportunity-card";
import { ProjectCard } from "@/components/projects/project-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { brand } from "@/config/brand";
import { howCkrWorks, roleLandings } from "@/config/public-landing";
import { siteConfig } from "@/config/site";
import { listPublishedOpportunities } from "@/lib/opportunities/queries";
import { listPublishedProjects } from "@/lib/projects/queries";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: "/",
    type: "website",
    locale: siteConfig.ogLocale,
    siteName: siteConfig.name,
  },
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [projects, opportunities] = await Promise.all([
    listPublishedProjects(),
    listPublishedOpportunities(),
  ]);

  const previewProjects = projects.slice(0, 3);
  const previewOpportunities = opportunities.slice(0, 3);

  return (
    <>
      {/* Hero: brand + one headline + support + CTAs */}
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
              <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.85rem] lg:leading-[1.12]">
                {brand.name} — {brand.fullName}
              </h1>
            </div>

            <div
              aria-hidden
              className="animate-line-draw mt-8 h-px w-28 origin-left bg-accent"
            />

            <p className="animate-fade-up mt-8 font-display text-xl font-semibold tracking-tight text-accent sm:text-2xl">
              {brand.tagline}
            </p>

            <p
              className="animate-fade-up mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
              style={{ animationDelay: "120ms" }}
            >
              {brand.promise}
            </p>

            <div
              className="animate-fade-up mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
              style={{ animationDelay: "220ms" }}
            >
              <ButtonLink href="/lia" size="lg">
                Создать проект с Лией
              </ButtonLink>
              <ButtonLink href="/projects" variant="outline" size="lg">
                Найти проект
              </ButtonLink>
              <ButtonLink href="/investments" variant="outline" size="lg">
                Найти инвестиции
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Как работает ЦКР"
            title="Три шага к комплексному решению"
            description={`${brand.journey.join(" → ")}.`}
          />
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {howCkrWorks.map((item) => (
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
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Для кого"
            title="Предприниматели, инвесторы, эксперты"
            description="Выберите свою роль — ЦКР закрывает разные стороны одной задачи."
          />
          <div className="mt-12 grid gap-10 lg:grid-cols-3">
            {(
              [
                roleLandings.entrepreneurs,
                roleLandings.investors,
                roleLandings.experts,
              ] as const
            ).map((role) => (
              <div key={role.slug} className="border-t border-border pt-6">
                <Badge variant="soft">{role.eyebrow}</Badge>
                <h3 className="mt-4 font-display text-xl text-foreground">
                  {role.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {role.solution}
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
              eyebrow="Возможности"
              title="Ресурсы для реализации"
              description="Земля, помещения, оборудование и готовый бизнес."
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
              description="Разместите ресурс или откройте демо-каталог, чтобы увидеть примеры."
              actionHref="/opportunities"
              actionLabel="К каталогу возможностей"
            />
          )}
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Проекты"
              title="Идеи, которым нужны ресурсы"
              description="Центральная сущность ЦКР — проекты, вокруг которых собираются капитал и партнёры."
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
              description="Создайте первый проект с Лией — от идеи до поиска ресурсов."
              actionHref="/lia"
              actionLabel="Создать проект с Лией"
            />
          )}
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Преимущества ЦКР"
            title="Инвестиционный уровень доверия"
            description="Тёмно-синяя палитра, золотые акценты и прозрачные процессы — платформа для серьёзных решений."
          />
          <ul className="mt-12 grid gap-8 sm:grid-cols-2">
            {brand.advantages.map((item, index) => (
              <li key={item.title} className="border-l border-accent/40 pl-5">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  0{index + 1}
                </p>
                <h3 className="mt-3 font-display text-xl text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-xl">
            <Badge variant="accent">Первый шаг</Badge>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Начните с Лии или регистрации
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              За 30 секунд выберите действие: оформить проект, найти капитал или
              изучить каталоги ЦКР.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href="/lia" size="lg">
              Создать проект с Лией
            </ButtonLink>
            <ButtonLink href="/register" variant="outline" size="lg">
              Создать аккаунт
            </ButtonLink>
            <ButtonLink href="/about" variant="outline" size="lg">
              О платформе
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
