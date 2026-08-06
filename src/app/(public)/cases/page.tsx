import { PublicLiaEntry } from "@/components/marketing/public-lia-entry";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { TINDA_PUBLIC_CASE } from "@/config/marketplace";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Кейсы",
  description:
    "Публичные кейсы ЦКР: ТИНДА — первый проект развития через платформу.",
  openGraph: {
    title: "Кейсы · ЦКР",
    description: TINDA_PUBLIC_CASE.summary,
    url: "/cases",
    type: "website",
    locale: siteConfig.ogLocale,
  },
  alternates: { canonical: "/cases" },
};

export default function CasesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border py-16 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-radial opacity-80"
        />
        <Container className="relative max-w-3xl">
          <Badge variant="accent">Кейсы</Badge>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Результаты на реальных проектах
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
            ЦКР — не демо в вакууме. Здесь публичные разборы того, как
            организации проходят путь от идеи до реализации.
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Production case"
            title={TINDA_PUBLIC_CASE.title}
            description={TINDA_PUBLIC_CASE.summary}
          />
          <ol className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            {TINDA_PUBLIC_CASE.path.map((step, index) => (
              <li key={step} className="flex items-center gap-3">
                {index > 0 ? (
                  <span className="hidden text-muted sm:inline">→</span>
                ) : null}
                <span className="border-l border-accent/40 pl-4 font-display text-xl text-foreground">
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-10 max-w-2xl space-y-4 text-sm leading-relaxed text-muted sm:text-base">
            <p>
              ООО ТИНДА использует контур ЦКР: организация → проект → анализ
              Лии → workspace → партнёры и сделки. Это первый публичный ориентир
              marketplace layer.
            </p>
            <p>
              Подробности для команды и операторов — во внутренней документации
              production case; здесь — смысл для участников экосистемы.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/projects">Каталог проектов</ButtonLink>
            <ButtonLink href="/organization" variant="outline">
              Для организаций
            </ButtonLink>
            <ButtonLink href="/how-it-works" variant="outline">
              Как работает ЦКР
            </ButtonLink>
          </div>
        </Container>
      </section>

      <PublicLiaEntry compact />
    </>
  );
}
