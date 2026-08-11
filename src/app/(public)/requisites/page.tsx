import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import {
  getPublishedLegalFields,
  legalConfig,
} from "@/config/legal";
import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Реквизиты и правовая информация",
  description:
    "Правовая информация о проекте ЦКР и индивидуальном предпринимателе, осуществляющем деятельность платформы.",
  openGraph: {
    title: `Реквизиты · ${siteConfig.name}`,
    description:
      "ЦКР — проект/бренд. Деятельность ведётся индивидуальным предпринимателем.",
    url: "/requisites",
    type: "website",
    locale: siteConfig.ogLocale,
    siteName: siteConfig.name,
  },
  alternates: { canonical: "/requisites" },
};

export default function RequisitesPage() {
  const fields = getPublishedLegalFields();

  return (
    <>
      <section className="relative overflow-hidden border-b border-border py-16 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-hero-radial opacity-80"
        />
        <Container className="relative max-w-3xl">
          <Badge variant="accent">Правовая информация</Badge>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Реквизиты и правовая информация
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
            {legalConfig.copy.requisitesIntro}
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container className="max-w-3xl space-y-12">
          <article className="space-y-4">
            <h2 className="font-display text-xl text-foreground sm:text-2xl">
              О проекте
            </h2>
            <p className="text-base leading-relaxed text-muted">
              {legalConfig.copy.projectDefinition}
            </p>
            <p className="text-base leading-relaxed text-muted">
              {legalConfig.copy.activityLine}
            </p>
          </article>

          <article className="space-y-4" id="founder">
            <h2 className="font-display text-xl text-foreground sm:text-2xl">
              Основатель ЦКР
            </h2>
            <p className="text-base leading-relaxed text-foreground">
              {legalConfig.founderFullName}
            </p>
            <p className="text-base leading-relaxed text-muted">
              {legalConfig.founderStatement}
            </p>
          </article>

          <article className="space-y-4">
            <h2 className="font-display text-xl text-foreground sm:text-2xl">
              Реквизиты оператора
            </h2>
            <dl className="divide-y divide-border border border-border">
              {fields.map((field) => (
                <div
                  key={field.label}
                  className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4"
                >
                  <dt className="text-sm text-muted">{field.label}</dt>
                  <dd className="text-sm text-foreground">
                    {field.label === "Email" ? (
                      <a
                        href={`mailto:${field.value}`}
                        className="text-accent hover:underline"
                      >
                        {field.value}
                      </a>
                    ) : (
                      field.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-sm leading-relaxed text-muted">
              ИНН, ОГРНИП и иные регистрационные данные для договоров
              предоставляются по запросу на{" "}
              <a
                href={`mailto:${legalConfig.operator.email}`}
                className="text-accent hover:underline"
              >
                {legalConfig.operator.email}
              </a>
              .
            </p>
          </article>

          <article className="space-y-3">
            <h2 className="font-display text-xl text-foreground sm:text-2xl">
              Документы
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-accent hover:underline">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-accent hover:underline">
                  Пользовательское соглашение
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-accent hover:underline">
                  О ЦКР
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-accent hover:underline">
                  Контакты
                </Link>
              </li>
            </ul>
          </article>
        </Container>
      </section>
    </>
  );
}
