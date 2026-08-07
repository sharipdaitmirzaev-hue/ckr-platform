import { CaseViewTracker } from "@/components/analytics/case-view-tracker";
import { PublicLiaEntry } from "@/components/marketing/public-lia-entry";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { TINDA_CASE_DETAIL } from "@/config/first-users";
import { TINDA_PUBLIC_CASE } from "@/config/marketplace";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Кейсы",
  description:
    "Публичные кейсы ЦКР: ТИНДА — развитие оптового направления через платформу. Реальные результаты отдельно от плана.",
  openGraph: {
    title: "Кейсы · ЦКР",
    description: TINDA_CASE_DETAIL.task,
    url: "/cases",
    type: "website",
    locale: siteConfig.ogLocale,
  },
  alternates: { canonical: "/cases" },
};

export default function CasesPage() {
  return (
    <>
      <CaseViewTracker caseId="tinda" />
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
            ЦКР — не демо в вакууме. Публичные разборы помогают новым участникам
            понять путь от задачи до результата. Реальные итоги отделены от
            планируемых шагов.
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="max-w-3xl space-y-12">
          <div>
            <Badge variant="soft">{TINDA_CASE_DETAIL.eyebrow}</Badge>
            <h2 className="mt-4 font-display text-3xl font-semibold text-foreground">
              {TINDA_CASE_DETAIL.title}
            </h2>
            <p className="mt-3 text-sm text-muted">{TINDA_PUBLIC_CASE.summary}</p>
            <ol className="mt-8 flex flex-wrap items-center gap-3 text-sm text-foreground">
              {TINDA_PUBLIC_CASE.path.map((step, index) => (
                <li key={step} className="flex items-center gap-3">
                  {index > 0 ? <span className="text-muted">↓</span> : null}
                  <span className="border-l border-accent/40 pl-3 font-display text-lg">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="border-l border-accent/40 pl-5">
            <h3 className="font-display text-xl text-foreground">Задача</h3>
            <p className="mt-3 text-base leading-relaxed text-muted">
              {TINDA_CASE_DETAIL.task}
            </p>
          </div>

          <div>
            <SectionHeading eyebrow="Контекст" title="Исходная ситуация" />
            <ul className="mt-6 space-y-4 text-sm leading-relaxed text-muted sm:text-base">
              <li>
                <span className="font-medium text-foreground">Идея: </span>
                {TINDA_CASE_DETAIL.before.idea}
              </li>
              <li>
                <span className="font-medium text-foreground">Ресурсы: </span>
                {TINDA_CASE_DETAIL.before.resources}
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Ограничения:{" "}
                </span>
                {TINDA_CASE_DETAIL.before.limits}
              </li>
            </ul>
          </div>

          <div>
            <SectionHeading eyebrow="Платформа" title="Что сделал ЦКР" />
            <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted sm:text-base">
              {TINDA_CASE_DETAIL.ckrDid.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeading eyebrow="Итог" title="Результаты" />
            <p className="mt-6 text-sm font-medium text-foreground">
              Реальные результаты
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted sm:text-base">
              {TINDA_CASE_DETAIL.resultsReal.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted">
              <span className="font-medium text-foreground">
                Текущий этап:{" "}
              </span>
              {TINDA_CASE_DETAIL.result.stage}
            </p>
          </div>

          <div>
            <SectionHeading eyebrow="План" title="Следующие шаги" />
            <p className="mt-4 text-sm text-muted">
              Ниже — планируемые действия, не зафиксированные как итоговый
              результат пилота.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted sm:text-base">
              {TINDA_CASE_DETAIL.resultsPlanned.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-border pt-8">
            <ButtonLink href="/lia?scenario=business_audit">
              Получить аудит
            </ButtonLink>
            <ButtonLink href="/projects" variant="outline">
              Каталог проектов
            </ButtonLink>
            <ButtonLink href="/trust" variant="outline">
              Доверие к ЦКР
            </ButtonLink>
            <ButtonLink href="/organization" variant="outline">
              Для организаций
            </ButtonLink>
          </div>
        </Container>
      </section>

      <PublicLiaEntry compact />
    </>
  );
}
